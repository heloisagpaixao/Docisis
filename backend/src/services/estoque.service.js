const estoqueRepository = require("../repositories/estoque.repository");
const { diasAlertaValidade } = require("../utils/alertas");

const erro = (status, mensagem) => ({ status, mensagem });

/** Lista de lotes com saldo (busca, filtros e ordenação). Sem filtros, funciona como antes. */
const listar = (filtros) =>
  estoqueRepository.findAllDetalhado({
    ...filtros,
    diasAlerta: diasAlertaValidade(),
  });
const resumo = () => estoqueRepository.resumo(diasAlertaValidade());
const baixo = (limite) => estoqueRepository.findBaixo(limite);

async function buscarPorLote(idLote) {
  const item = await estoqueRepository.findByLoteId(idLote);
  if (!item) throw erro(404, "Lote não encontrado ou sem saldo em estoque");
  return item;
}

module.exports = { listar, resumo, baixo, buscarPorLote };
