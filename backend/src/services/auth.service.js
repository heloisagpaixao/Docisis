const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const funcionarioRepository = require("../repositories/FuncionarioRepository");

/**
 * Devolve { token, funcionario, permissoes } ou null se as credenciais forem inválidas.
 * A mesma resposta (null) vale para e-mail inexistente e senha errada.
 */
async function login(email, senha) {
  const funcionario = await funcionarioRepository.findByEmailWithCargo(email);
  const senhaOk =
    funcionario && (await bcrypt.compare(senha, funcionario.senha));
  if (!senhaOk) return null;

  const token = jwt.sign(
    { id: funcionario.id, cargo: funcionario.cargo },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" },
  );

  return {
    token,
    funcionario: {
      id: funcionario.id,
      nome: funcionario.nome,
      email: funcionario.email,
      cargo: funcionario.cargo,
    },
    permissoes: await funcionarioRepository.findPermissoes(funcionario.id),
  };
}

module.exports = { login };
