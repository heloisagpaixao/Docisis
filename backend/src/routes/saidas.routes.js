const ajusteRepository = require("../repositories/AjusteRepository");
const loteRepository = require("../repositories/LoteRepository");

const erro = (status, mensagem) => ({ status, mensagem });

const listar = (filtros) => ajusteRepository.findAll(filtros);

async function buscar(id) {
  const ajuste = await ajusteRepository.findById(id);
  if (!ajuste) throw erro(404, "Ajuste não encontrado");
  return ajuste;
}

/**
 * Define o saldo do lote como `quantidade_nova` e guarda o antes/depois no histórico.
 * Ajustes não podem ser editados nem excluídos: são o registro de auditoria.
 */
async function criar({ id_lote, quantidade_nova, motivo }, idFuncionario) {
  const lote = await loteRepository.findById(id_lote);
  if (!lote) throw erro(404, "Lote não encontrado");
  if (lote.quantidade === quantidade_nova) {
    throw erro(
      400,
      `A nova quantidade é igual à atual (${lote.quantidade}); não há o que ajustar`,
    );
  }
  const ajuste = await ajusteRepository.create({
    id_lote,
    id_funcionario: idFuncionario,
    quantidade_nova,
    motivo,
  });
  return ajusteRepository.findById(ajuste.id_ajuste);
}

module.exports = { listar, buscar, criar };
