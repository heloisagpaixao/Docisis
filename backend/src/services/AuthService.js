const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const FuncionariosRepository = require("../repositories/FuncionariosRepository");

class AuthService {
  async login(email, senha) {
    const funcionario =
      await FuncionariosRepository.findByEmailWithCargo(email);

    if (!funcionario || !funcionario.senha) {
      throw new Error("Credenciais inválidas");
    }

    const senhaValida = await bcrypt.compare(senha, funcionario.senha);

    if (!senhaValida) {
      throw new Error("Credenciais inválidas");
    }

    const payload = {
      id: funcionario.id,
      nome: funcionario.nome,
      id_cargo: funcionario.id_cargo,
      permissoes: funcionario.permissoes,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "8h",
    });

    delete funcionario.senha;

    return { token, funcionario };
  }

  async hashSenha(senhaPlana) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(senhaPlana, salt);
  }
}

module.exports = new AuthService();
