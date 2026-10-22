const cargoRepository = require("../repositories/CargoRepository");

const erro = (status, mensagem) => ({ status, mensagem });

const listar = (paginacao) => cargoRepository.findAll(paginacao);
const catalogoPermissoes = () => cargoRepository.findAllPermissoes();

async function buscar(id) {
  const cargo = await cargoRepository.findById(id);
  if (!cargo) throw erro(404, "Cargo não encontrado");
  return cargo;
}

async function criar({ nome, permissoes }) {
  if (await cargoRepository.findByNome(nome))
    throw erro(409, "Já existe um cargo com este nome");
  const { id_cargo } = await cargoRepository.create({ nome, permissoes });
  return cargoRepository.findById(id_cargo);
}

async function atualizar(id, { nome, permissoes }) {
  await buscar(id);
  if (nome !== undefined) {
    const existente = await cargoRepository.findByNome(nome);
    if (existente && existente.id_cargo !== Number(id)) {
      throw erro(409, "Já existe um cargo com este nome");
    }
  }
  await cargoRepository.update(id, { nome, permissoes });
  return cargoRepository.findById(id);
}

async function excluir(id) {
  await buscar(id);
  if (await cargoRepository.hasDependents(id)) {
    throw erro(409, "Há funcionários vinculados a este cargo");
  }
  await cargoRepository.delete(id);
}

module.exports = {
  listar,
  catalogoPermissoes,
  buscar,
  criar,
  atualizar,
  excluir,
};
