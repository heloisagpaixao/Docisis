const repo = require("../repositories/produtos.repository");

const CAMPOS_EDITAVEIS = ["nome", "dt_validade", "codigo", "peso", "imagem"];

const listar = (filtros) => repo.listar(filtros);
const buscarPorId = (id) => repo.buscarPorId(id);

async function criar({
  nome,
  dt_validade,
  codigo,
  peso = null,
  imagem = null,
}) {
  const id = await repo.inserir({
    nome: nome.trim(),
    dt_validade,
    codigo,
    peso,
    imagem,
  });
  return repo.buscarPorId(id);
}

async function atualizar(id, dados) {
  const campos = {};
  for (const c of CAMPOS_EDITAVEIS) {
    if (dados[c] !== undefined) campos[c] = dados[c];
  }
  if (Object.keys(campos).length === 0) return repo.buscarPorId(id);
  const ok = await repo.atualizar(id, campos);
  return ok ? repo.buscarPorId(id) : null;
}

const excluir = (id) => repo.excluir(id);

module.exports = { listar, buscarPorId, criar, atualizar, excluir };
