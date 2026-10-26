const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Descobre o tipo REAL do arquivo pelos primeiros bytes (a "assinatura").
 * O nome e o Content-Type enviados pelo cliente NÃO são confiáveis: qualquer um
 * pode mandar um .exe chamado foto.jpg. Devolve { mime, ext } ou null.
 */
function detectarTipo(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return null;

  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { mime: "image/jpeg", ext: ".jpg" };
  }
  if (buf.subarray(0, 8).equals(PNG)) {
    return { mime: "image/png", ext: ".png" };
  }
  if (
    buf.subarray(0, 4).toString("latin1") === "RIFF" &&
    buf.subarray(8, 12).toString("latin1") === "WEBP"
  ) {
    return { mime: "image/webp", ext: ".webp" };
  }
  if (buf.subarray(0, 5).toString("latin1") === "%PDF-") {
    return { mime: "application/pdf", ext: ".pdf" };
  }
  return null; // SVG, HTML, executáveis etc. caem aqui
}

// Tipo de conteúdo ao devolver o arquivo, pela extensão que NÓS geramos
const MIME_POR_EXTENSAO = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

module.exports = { detectarTipo, MIME_POR_EXTENSAO };
