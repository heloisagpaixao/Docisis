const produtoRepository = require("../repositories/produtos.repository");

const erro = (status, mensagem) => ({ status, mensagem });

const listar = (filtros) => produtoRepository.findAll(filtros);

async function buscar(id) {
  const produto = await produtoRepository.findById(id);
  if (!produto) throw erro(404, "Produto não encontrado");
  return produto;
}

async function criar(dados) {
  if (await produtoRepository.findByCodigo(dados.codigo)) {
    throw erro(409, "Já existe um produto com este código");
  }
  const id = await produtoRepository.create(dados);
  return produtoRepository.findById(id);
}

async function atualizar(id, dados) {
  await buscar(id);
  if (dados.codigo !== undefined) {
    const existente = await produtoRepository.findByCodigo(dados.codigo);
    if (existente && existente.id_produto !== Number(id)) {
      throw erro(409, "Já existe um produto com este código");
    }
  }
  await produtoRepository.update(id, dados);
  return produtoRepository.findById(id);
}

async function excluir(id) {
  await buscar(id);
  if (await produtoRepository.hasDependents(id)) {
    throw erro(409, "Produto possui lotes cadastrados e não pode ser excluído");
  }
  await produtoRepository.delete(id);
}

module.exports = { listar, buscar, criar, atualizar, excluir };
