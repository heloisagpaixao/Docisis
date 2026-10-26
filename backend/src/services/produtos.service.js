const produtoRepository = require("../repositories/produtos.repository");
const notificacoes = require("./notificacoes.service");
const arquivos = require("./arquivos.service");

const erro = (status, mensagem) => ({ status, mensagem });

const listar = (filtros) => produtoRepository.findAll(filtros);

async function buscar(id) {
  const produto = await produtoRepository.findById(id);
  if (!produto) throw erro(404, "Produto não encontrado");
  return produto;
}

function conferirLimites(minimo, maximo) {
  if (
    minimo !== null &&
    minimo !== undefined &&
    maximo !== null &&
    maximo !== undefined &&
    minimo > maximo
  ) {
    throw erro(400, "estoque_minimo não pode ser maior que estoque_maximo");
  }
}

async function criar(dados) {
  conferirLimites(dados.estoque_minimo, dados.estoque_maximo);
  if (await produtoRepository.findByCodigo(dados.codigo)) {
    throw erro(409, "Já existe um produto com este código");
  }
  const id = await produtoRepository.create(dados);
  notificacoes.agendarVerificacao();
  return produtoRepository.findById(id);
}

async function atualizar(id, dados) {
  const atual = await buscar(id);
  conferirLimites(
    dados.estoque_minimo !== undefined
      ? dados.estoque_minimo
      : atual.estoque_minimo,
    dados.estoque_maximo !== undefined
      ? dados.estoque_maximo
      : atual.estoque_maximo,
  );
  if (dados.codigo !== undefined) {
    const existente = await produtoRepository.findByCodigo(dados.codigo);
    if (existente && existente.id_produto !== Number(id)) {
      throw erro(409, "Já existe um produto com este código");
    }
  }
  await produtoRepository.update(id, dados);
  notificacoes.agendarVerificacao();
  return produtoRepository.findById(id);
}

async function excluir(id) {
  const produto = await buscar(id);
  if (await produtoRepository.hasDependents(id)) {
    throw erro(409, "Produto possui lotes cadastrados e não pode ser excluído");
  }
  await produtoRepository.delete(id);
  await arquivos.remover(produto.imagem);
  notificacoes.agendarVerificacao();
}

async function salvarImagem(id, arquivo) {
  const produto = await buscar(id);
  await arquivos.substituir({
    pasta: "produtos",
    arquivo,
    atual: produto.imagem,
    gravar: (caminho) => produtoRepository.update(id, { imagem: caminho }),
  });
  return buscar(id);
}

async function removerImagem(id) {
  const produto = await buscar(id);
  await produtoRepository.update(id, { imagem: null });
  await arquivos.remover(produto.imagem);
}

async function caminhoImagem(id) {
  const produto = await buscar(id);
  if (!produto.imagem) throw erro(404, "Produto não possui imagem");
  return produto.imagem;
}

module.exports = {
  listar,
  buscar,
  criar,
  atualizar,
  excluir,
  salvarImagem,
  removerImagem,
  caminhoImagem,
};
