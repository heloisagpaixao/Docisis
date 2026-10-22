const entradaRepository = require("../repositories/EntradaRepository");

const erro = (status, mensagem) => ({ status, mensagem });

const listar = (filtros) => entradaRepository.findAll(filtros);

async function buscar(id) {
  const entrada = await entradaRepository.findById(id);
  if (!entrada) throw erro(404, "Entrada não encontrada");
  return entrada;
}

// O responsável é SEMPRE quem está logado (vem do token), nunca do corpo da requisição.
async function criar({ id_lote, quantidade, motivo }, idFuncionario) {
  // o repository soma no saldo do lote e grava a entrada na mesma transação (404 se o lote não existe)
  const id = await entradaRepository.create({
    id_funcionario: idFuncionario,
    id_lote,
    quantidade,
    motivo,
  });
  return entradaRepository.findById(id);
}

// Só o motivo pode ser corrigido: quantidade, lote e responsável são parte da auditoria.
async function atualizar(id, { motivo }) {
  await buscar(id);
  await entradaRepository.update(id, { motivo });
  return entradaRepository.findById(id);
}

// Estorna o saldo do lote (409 se parte da entrada já foi consumida; 404 se não existe)
async function excluir(id) {
  await entradaRepository.delete(id);
}

module.exports = { listar, buscar, criar, atualizar, excluir };
