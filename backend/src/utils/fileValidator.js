const fs = require("fs");

/**
 * Valida o conteúdo real do arquivo inspecionando seus magic bytes (assinatura binária).
 * Impede que arquivos maliciosos renomeados com extensões falsas (.jpg, .png, .pdf)
 * sejam aceitos pelo servidor.
 *
 * @param {string} filePath Caminho absoluto do arquivo no disco
 * @param {Array<string>} allowedTypes Lista de tipos permitidos: 'jpeg', 'png', 'pdf'
 * @returns {boolean} Retorna true se a assinatura for válida
 */
function validarMagicBytes(filePath, allowedTypes = ["jpeg", "png", "pdf"]) {
  if (!filePath || !fs.existsSync(filePath)) {
    return false;
  }

  let fd = null;
  try {
    const buffer = Buffer.alloc(8);
    fd = fs.openSync(filePath, "r");
    fs.readSync(fd, buffer, 0, 8, 0);

    // JPEG: FF D8 FF
    const isJpeg =
      buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

    // PNG: 89 50 4E 47 (0x89 'P' 'N' 'G')
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47;

    // PDF: 25 50 44 46 ('%PDF')
    const isPdf =
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46;

    if (allowedTypes.includes("jpeg") && isJpeg) return true;
    if (allowedTypes.includes("jpg") && isJpeg) return true;
    if (allowedTypes.includes("png") && isPng) return true;
    if (allowedTypes.includes("pdf") && isPdf) return true;

    return false;
  } catch (error) {
    console.error("Erro ao validar magic bytes do arquivo:", error);
    return false;
  } finally {
    if (fd !== null) {
      try {
        fs.closeSync(fd);
      } catch (e) {
        // Ignora erro no fechamento
      }
    }
  }
}

module.exports = {
  validarMagicBytes,
};
