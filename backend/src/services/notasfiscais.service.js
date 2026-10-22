const notaRepository = require("../repositories/notasfiscais.repository");

const erro = (status, mensagem) => ({ status, mensagem });

const listar = (filtros) => notaRepository.findAll(filtros);

async function buscar(id) {
  const nota = await notaRepository.findById(id);
  if (!nota) throw erro(404, "Nota fiscal não encontrada");
  return nota;
}

async function criar(dados) {
  const id = await notaRepository.create(dados);
  return notaRepository.findById(id);
}

async function atualizar(id, dados) {
  await buscar(id);
  await notaRepository.update(id, dados);
  return notaRepository.findById(id);
}

async function excluir(id) {
  await buscar(id);
  if (await notaRepository.hasDependents(id)) {
    throw erro(
      409,
      "Nota fiscal possui lotes vinculados e não pode ser excluída",
    );
  }
  await notaRepository.delete(id);
}

module.exports = { listar, buscar, criar, atualizar, excluir };
