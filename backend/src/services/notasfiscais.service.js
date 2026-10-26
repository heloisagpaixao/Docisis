const notaRepository = require("../repositories/notasfiscais.repository");
const arquivos = require("./arquivos.service");

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
  const nota = await buscar(id);
  if (await notaRepository.hasDependents(id)) {
    throw erro(
      409,
      "Nota fiscal possui lotes vinculados e não pode ser excluída",
    );
  }
  await notaRepository.delete(id);
  await arquivos.remover(nota.arquivo);
}

async function salvarArquivo(id, arquivo) {
  const nota = await buscar(id);
  await arquivos.substituir({
    pasta: "notas",
    arquivo,
    atual: nota.arquivo,
    gravar: (caminho) => notaRepository.update(id, { arquivo: caminho }),
  });
  return buscar(id);
}

async function removerArquivo(id) {
  const nota = await buscar(id);
  await notaRepository.update(id, { arquivo: null });
  await arquivos.remover(nota.arquivo);
}

async function caminhoArquivo(id) {
  const nota = await buscar(id);
  if (!nota.arquivo) throw erro(404, "Nota fiscal não possui arquivo");
  return nota.arquivo;
}

module.exports = {
  listar,
  buscar,
  criar,
  atualizar,
  excluir,
  salvarArquivo,
  removerArquivo,
  caminhoArquivo,
};
