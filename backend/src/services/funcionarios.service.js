const bcrypt = require("bcrypt");
const funcionarioRepository = require("../repositories/FuncionarioRepository");
const cargoRepository = require("../repositories/CargoRepository");

const erro = (status, mensagem) => ({ status, mensagem });
const CAMPOS_EDITAVEIS = ["nome", "email", "telefone", "foto_perfil"];

async function garantirCargo(id_cargo) {
  if (!(await cargoRepository.findById(id_cargo))) {
    throw erro(400, "Cargo informado não existe");
  }
}

const listar = (paginacao) => funcionarioRepository.findAll(paginacao);

async function buscar(id) {
  const funcionario = await funcionarioRepository.findById(id);
  if (!funcionario) throw erro(404, "Funcionário não encontrado");
  return funcionario;
}

async function criar(dados) {
  await garantirCargo(dados.id_cargo);
  if (await funcionarioRepository.findByCpf(dados.cpf))
    throw erro(409, "CPF já cadastrado");
  if (await funcionarioRepository.findByEmail(dados.email))
    throw erro(409, "E-mail já cadastrado");

  const id = await funcionarioRepository.create({
    nome: dados.nome,
    cpf: dados.cpf,
    email: dados.email,
    senha: await bcrypt.hash(dados.senha, 10),
    telefone: dados.telefone,
    id_cargo: dados.id_cargo,
    foto_perfil: dados.foto_perfil ?? null,
  });
  return funcionarioRepository.findById(id);
}

async function atualizar(id, dados) {
  await buscar(id);

  if (dados.email) {
    const existente = await funcionarioRepository.findByEmail(dados.email);
    if (existente && existente.id !== Number(id))
      throw erro(409, "E-mail já cadastrado");
  }

  // O cargo NÃO é alterado por aqui: tem rota própria, com permissão própria.
  const campos = {};
  for (const campo of CAMPOS_EDITAVEIS) {
    if (dados[campo] !== undefined) campos[campo] = dados[campo];
  }
  if (dados.senha) campos.senha = await bcrypt.hash(dados.senha, 10);

  await funcionarioRepository.update(id, campos);
  return funcionarioRepository.findById(id);
}

async function alterarCargo(id, id_cargo, idSolicitante) {
  if (Number(id) === idSolicitante)
    throw erro(400, "Você não pode alterar o próprio cargo");
  await buscar(id);
  await garantirCargo(id_cargo);
  await funcionarioRepository.update(id, { id_cargo });
  return funcionarioRepository.findById(id);
}

async function excluir(id, idSolicitante) {
  if (Number(id) === idSolicitante)
    throw erro(400, "Você não pode excluir o próprio usuário");
  await buscar(id);
  if (await funcionarioRepository.hasDependents(id)) {
    throw erro(
      409,
      "Funcionário possui movimentações registradas e não pode ser excluído",
    );
  }
  await funcionarioRepository.delete(id);
}

module.exports = { listar, buscar, criar, atualizar, alterarCargo, excluir };
