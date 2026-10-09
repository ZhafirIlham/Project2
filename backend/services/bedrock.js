'use strict';

// =============================================================================
// Bedrock Service (R3.2, R3.3, R4.1, R8.2)
//
// Modul ini mengisolasi seluruh integrasi AWS Bedrock di satu tempat, terpisah
// dari layer route dan konfigurasi (lihat design.md - "Backend - Modul Internal").
//
// Dukungan model:
//   Payload & parsing respons dipilih berdasarkan BEDROCK_MODEL_ID:
//     - Model Amazon Nova (id mengandung 'nova', mis. us.amazon.nova-lite-v1:0)
//       memakai skema Nova: messages[].content[].text + inferenceConfig, dan
//       jawaban diambil dari output.message.content[0].text.
//     - Model lain diperlakukan sebagai Anthropic Claude Messages API:
//       anthropic_version + messages[{role,content:string}], jawaban dari
//       content[0].text.
//   Dengan begitu kode tetap bekerja bila pemilik berganti antara Nova & Claude.
//
// Kontrak kesalahan (dibaca oleh routes/chat.js):
//   `generateReply` MELEMPAR BedrockServiceError dengan properti `kind`:
//     - kind === 'timeout'  -> pemanggilan melewati batas 30 detik  -> 504
//     - kind === 'upstream' -> kegagalan SDK/model atau respons tak terurai -> 502
//   Pada keberhasilan, mengembalikan string `reply`.
// =============================================================================

const {
  BedrockRuntimeClient,
  InvokeModelCommand,
} = require('@aws-sdk/client-bedrock-runtime');

const config = require('../config');

// Batas waktu pemanggilan Bedrock: 30 detik (R3.2 / R4.1).
const BEDROCK_TIMEOUT_MS = 30000;

// Batas token keluaran model. Nilai konservatif yang memadai untuk jawaban chat.
const MAX_TOKENS = 1024;

/**
 * Kesalahan layanan Bedrock yang dapat dibedakan oleh pemanggil.
 * @property {'timeout' | 'upstream'} kind - kategori kegagalan.
 * @property {unknown} [cause] - penyebab asli (error SDK), untuk logging.
 */
class BedrockServiceError extends Error {
  /**
   * @param {'timeout' | 'upstream'} kind
   * @param {string} message
   * @param {unknown} [cause]
   */
  constructor(kind, message, cause) {
    super(message);
    this.name = 'BedrockServiceError';
    this.kind = kind;
    this.cause = cause;
  }
}

// Klien Bedrock dibuat sekali per proses dan diisolasi di modul ini.
// Region diambil dari config; KREDENSIAL TIDAK di-hardcode - dibiarkan mengikuti
// default credential provider chain AWS SDK (env, shared config, IAM role).
// Variabel AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY/AWS_REGION dari .env (dimuat
// oleh dotenv di config.js) otomatis dipakai oleh SDK. Pembuatan klien ini tidak
// melakukan panggilan jaringan saat modul dimuat, sehingga aman di-require.
let client = null;

/**
 * Mengembalikan instance BedrockRuntimeClient (lazy singleton).
 * @returns {BedrockRuntimeClient}
 */
function getClient() {
  if (client === null) {
    client = new BedrockRuntimeClient({ region: config.AWS_REGION });
  }
  return client;
}

/**
 * Deteksi apakah model id merujuk ke keluarga Amazon Nova.
 * @param {string} modelId
 * @returns {boolean}
 */
function isNovaModel(modelId) {
  return typeof modelId === 'string' && modelId.toLowerCase().includes('nova');
}

/**
 * Menyusun body payload permintaan sesuai keluarga model.
 * @param {string} message - pesan Siswa.
 * @param {string} modelId - BEDROCK_MODEL_ID.
 * @returns {string} JSON string body permintaan.
 */
function buildPayload(message, modelId) {
  if (isNovaModel(modelId)) {
    // Skema Amazon Nova (nova-lite/micro/pro).
    return JSON.stringify({
      messages: [{ role: 'user', content: [{ text: message }] }],
      inferenceConfig: { maxTokens: MAX_TOKENS },
    });
  }
  // Skema Anthropic Claude Messages API.
  return JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: MAX_TOKENS,
    messages: [{ role: 'user', content: message }],
  });
}

/**
 * Mengurai respons InvokeModelCommand menjadi teks jawaban (`reply`), sesuai
 * keluarga model. Parsing dilakukan defensif: respons tak terurai/kosong
 * diperlakukan sebagai kegagalan upstream.
 *
 * @param {{ body?: Uint8Array }} response - keluaran dari client.send.
 * @param {string} modelId - BEDROCK_MODEL_ID.
 * @returns {string} teks jawaban model (reply) yang terjamin non-kosong.
 * @throws {BedrockServiceError} kind 'upstream' bila respons tak terurai/kosong.
 */
function parseReply(response, modelId) {
  let text;
  try {
    const raw = response && response.body;
    if (!raw) {
      throw new Error('Respons Bedrock tidak memiliki body.');
    }
    text = Buffer.from(raw).toString('utf-8');
  } catch (err) {
    throw new BedrockServiceError(
      'upstream',
      'Gagal membaca body respons dari Bedrock.',
      err,
    );
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    throw new BedrockServiceError(
      'upstream',
      'Respons Bedrock bukan JSON yang valid.',
      err,
    );
  }

  let reply = null;
  if (isNovaModel(modelId)) {
    // Nova: output.message.content[0].text
    const content =
      json &&
      json.output &&
      json.output.message &&
      Array.isArray(json.output.message.content)
        ? json.output.message.content
        : null;
    if (content && content[0] && typeof content[0].text === 'string') {
      reply = content[0].text;
    }
  } else {
    // Claude: content[0].text
    if (
      json &&
      Array.isArray(json.content) &&
      json.content[0] &&
      typeof json.content[0].text === 'string'
    ) {
      reply = json.content[0].text;
    }
  }

  if (reply === null || reply.trim() === '') {
    throw new BedrockServiceError(
      'upstream',
      'Respons Bedrock tidak berisi teks jawaban yang dapat ditampilkan.',
    );
  }

  return reply;
}

/**
 * Memanggil Bedrock untuk menghasilkan jawaban atas pesan Siswa.
 * Timeout 30 detik via AbortController; abort/timeout -> kind 'timeout',
 * kegagalan lain -> kind 'upstream'.
 *
 * @param {string} message - pesan Siswa (sudah divalidasi oleh layer route).
 * @returns {Promise<string>} teks jawaban model (reply).
 * @throws {BedrockServiceError} dengan `kind` 'timeout' atau 'upstream'.
 */
async function generateReply(message) {
  const modelId = config.BEDROCK_MODEL_ID;
  const command = new InvokeModelCommand({
    modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: buildPayload(message, modelId),
  });

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, BEDROCK_TIMEOUT_MS);

  let response;
  try {
    response = await getClient().send(command, {
      abortSignal: controller.signal,
    });
  } catch (err) {
    if (timedOut || isAbortError(err)) {
      throw new BedrockServiceError(
        'timeout',
        'Permintaan ke layanan AI melewati batas waktu 30 detik.',
        err,
      );
    }
    throw new BedrockServiceError(
      'upstream',
      'Layanan AI mengembalikan kegagalan saat memproses permintaan.',
      err,
    );
  } finally {
    clearTimeout(timer);
  }

  return parseReply(response, modelId);
}

/**
 * Mendeteksi apakah sebuah error merupakan pembatalan (abort).
 * @param {unknown} err
 * @returns {boolean}
 */
function isAbortError(err) {
  return (
    !!err &&
    typeof err === 'object' &&
    'name' in err &&
    err.name === 'AbortError'
  );
}

module.exports = {
  generateReply,
  BedrockServiceError,
  BEDROCK_TIMEOUT_MS,
};
