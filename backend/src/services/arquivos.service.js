const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { BASE } = require("../config/uploads");
const { MIME_POR_EXTENSAO } = require("../utils/tiposArquivo");

const erro = (status, mensagem) => ({ status, mensagem });

/**
 * Converte o caminho guardado no banco (ex.: "perfis/ab12.png") em caminho absoluto,
 * garantindo que ele fica DENTRO da pasta de uploads. Devolve null se tentar sair
 * dela (ex.: "../../etc/passwd").
 */
function resolver(relativo) {
  if (!relativo || typeof relativo !== "string") return null;
  const absoluto = path.resolve(BASE, relativo);
  return absoluto.startsWith(BASE + path.sep) ? absoluto : null;
}

/**
 * Grava o arquivo com um nome ALEATÓRIO (o nome original do cliente nunca é usado,
 * o que elimina ataques por nome de arquivo). Devolve o caminho relativo.
 */
async function salvar(buffer, pasta, extensao) {
  const dir = path.join(BASE, pasta);
  await fs.mkdir(dir, { recursive: true });
  const nome = `${crypto.randomUUID()}${extensao}`;
  await fs.writeFile(path.join(dir, nome), buffer, { flag: "wx" }); // wx: nunca sobrescreve
  return `${pasta}/${nome}`;
}

/** Apaga o arquivo. Se já não existir, ignora; outras falhas só são registradas. */
async function remover(relativo) {
  const absoluto = resolver(relativo);
  if (!absoluto) return;
  try {
    await fs.unlink(absoluto);
  } catch (e) {
    if (e.code !== "ENOENT")
      console.error("Falha ao apagar arquivo:", e.message);
  }
}

/**
 * Troca o arquivo de um registro: grava o novo, atualiza o banco e só ENTÃO apaga o antigo.
 * Se o banco falhar, o arquivo novo é descartado (não sobra lixo no disco).
 */
async function substituir({ pasta, arquivo, atual, gravar }) {
  const novo = await salvar(arquivo.buffer, pasta, arquivo.ext);
  try {
    await gravar(novo);
  } catch (e) {
    await remover(novo);
    throw e;
  }
  await remover(atual);
  return novo;
}

/** Envia o arquivo na resposta HTTP (404 se o registro aponta para um arquivo que não existe). */
async function enviar(res, relativo, nomeDownload) {
  const absoluto = resolver(relativo);
  let existe = false;
  if (absoluto) {
    try {
      existe = (await fs.stat(absoluto)).isFile();
    } catch {
      existe = false;
    }
  }
  if (!existe) throw erro(404, "Arquivo não encontrado no servidor");

  res.set({
    "Content-Type":
      MIME_POR_EXTENSAO[path.extname(absoluto).toLowerCase()] ||
      "application/octet-stream",
    "X-Content-Type-Options": "nosniff", // o navegador não pode "adivinhar" outro tipo
    "Cache-Control": "private, no-cache", // arquivos internos: nada de cache compartilhado
  });
  if (nomeDownload)
    res.set("Content-Disposition", `inline; filename="${nomeDownload}"`);

  return new Promise((ok, falha) => {
    res.sendFile(absoluto, { dotfiles: "deny" }, (err) => {
      if (err && !res.headersSent) return falha(err);
      ok();
    });
  });
}

module.exports = { resolver, salvar, remover, substituir, enviar };
