const path = require("path");

// Pasta onde os arquivos ficam: backend/uploads (fora de src e FORA do acesso público).
// Pode ser trocada com UPLOADS_DIR no .env.
const BASE = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(__dirname, "..", "..", "uploads");

const MB = 1024 * 1024;

module.exports = {
  BASE,
  LIMITE_IMAGEM: (Number(process.env.UPLOAD_MAX_IMAGEM_MB) || 5) * MB,
  LIMITE_DOCUMENTO: (Number(process.env.UPLOAD_MAX_DOCUMENTO_MB) || 10) * MB,
};
