const multer = require("multer");
const { LIMITE_IMAGEM, LIMITE_DOCUMENTO } = require("../config/uploads");
const { detectarTipo } = require("../utils/tiposArquivo");

const erro = (status, mensagem) => ({ status, mensagem });

const TIPOS_IMAGEM = ["image/jpeg", "image/png", "image/webp"];
const TIPOS_DOCUMENTO = ["application/pdf", "image/jpeg", "image/png"];

/**
 * Recebe UM arquivo no campo `campo` (multipart/form-data), em memória, já com o
 * limite de tamanho aplicado, e confere o tipo REAL pelos bytes do arquivo.
 * Resultado: req.arquivo = { buffer, mime, ext }.
 */
function criarMiddleware(campo, limite, tiposPermitidos, descricaoTipos) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: limite, files: 1, fields: 5 },
  }).single(campo);

  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return next(
              erro(
                413,
                `Arquivo maior que o limite de ${Math.round(limite / 1048576)} MB`,
              ),
            );
          }
          if (err.code === "LIMIT_UNEXPECTED_FILE") {
            return next(erro(400, `Envie o arquivo no campo "${campo}"`));
          }
        }
        return next(
          erro(400, "Requisição de upload inválida (use multipart/form-data)"),
        );
      }

      if (!req.file) {
        return next(
          erro(
            400,
            `Envie o arquivo no campo "${campo}" (multipart/form-data)`,
          ),
        );
      }

      const tipo = detectarTipo(req.file.buffer);
      if (!tipo || !tiposPermitidos.includes(tipo.mime)) {
        return next(
          erro(
            415,
            `Tipo de arquivo não permitido. Aceitos: ${descricaoTipos}`,
          ),
        );
      }

      req.arquivo = { buffer: req.file.buffer, mime: tipo.mime, ext: tipo.ext };
      next();
    });
  };
}

module.exports = {
  receberImagem: (campo) =>
    criarMiddleware(campo, LIMITE_IMAGEM, TIPOS_IMAGEM, "JPEG, PNG ou WEBP"),
  receberDocumento: (campo) =>
    criarMiddleware(
      campo,
      LIMITE_DOCUMENTO,
      TIPOS_DOCUMENTO,
      "PDF, JPEG ou PNG",
    ),
};
