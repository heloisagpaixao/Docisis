const estoqueRepository = require("../repositories/EstoqueRepository");

const erro = (status, mensagem) => ({ status, mensagem });

const listar = (paginacao) => estoqueRepository.findAll(paginacao);
const baixo = (limite) => estoqueRepository.findBaixo(limite);

async function buscarPorLote(idLote) {
  const item = await estoqueRepository.findByLoteId(idLote);
  if (!item) throw erro(404, "Lote não encontrado ou sem saldo em estoque");
  return item;
}

module.exports = { listar, baixo, buscarPorLote };
