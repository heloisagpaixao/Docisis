const saidaRepository = require("../repositories/saidas.repository");
const notificacoes = require("./notificacoes.service");

const erro = (status, mensagem) => ({ status, mensagem });

const listar = (filtros) => saidaRepository.findAll(filtros);

async function buscar(id) {
  const saida = await saidaRepository.findById(id);
  if (!saida) throw erro(404, "Saída não encontrada");
  return saida;
}

// O responsável é SEMPRE quem está logado (vem do token), nunca do corpo da requisição.
async function criar({ id_lote, quantidade, motivo }, idFuncionario) {
  // o repository confere o saldo com o lote travado (400 se a quantidade excede; 404 se o lote não existe)
  const id = await saidaRepository.create({
    id_funcionario: idFuncionario,
    id_lote,
    quantidade,
    motivo,
  });
  notificacoes.agendarVerificacao();
  return saidaRepository.findById(id);
}

// Só quantidade e motivo podem ser corrigidos; o saldo do lote acompanha a diferença.
async function atualizar(id, dados) {
  await saidaRepository.update(id, dados);
  notificacoes.agendarVerificacao();
  return saidaRepository.findById(id);
}

// Devolve a quantidade ao lote (404 se não existe)
async function excluir(id) {
  await saidaRepository.delete(id);
  notificacoes.agendarVerificacao();
}

module.exports = { listar, buscar, criar, atualizar, excluir };
