const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const FuncionariosRepository = require("../repositories/FuncionarioRepository");

class AuthService {
  async login(email, cpf, senha) {
    if (!email || !cpf || !senha) {
      throw { status: 400, mensagem: "E-mail corporativo, CPF e senha são obrigatórios." };
    }

    const emailLimpo = email.trim().toLowerCase();
    const cpfLimpo = cpf.trim();

    const funcionario = await FuncionariosRepository.findByEmailAndCpf(emailLimpo, cpfLimpo);
    if (!funcionario) {
      throw { status: 401, mensagem: "Credenciais inválidas." };
    }

    const senhaCorreta = await bcrypt.compare(senha, funcionario.senha);
    if (!senhaCorreta) {
      throw { status: 401, mensagem: "Credenciais inválidas." };
    }

    // JWT payload: id, nome, email, id_cargo, permissoes
    const payload = {
      id: funcionario.id,
      nome: funcionario.nome,
      email: funcionario.email,
      id_cargo: funcionario.id_cargo,
      permissoes: funcionario.permissoes,
    };

    const secret = process.env.JWT_SECRET || "super_secret_key_docisis_2026";
    const expiresIn = process.env.JWT_EXPIRES_IN || "1d";

    const token = jwt.sign(payload, secret, { expiresIn });

    return {
      sucesso: true,
      mensagem: "Autenticação realizada com sucesso.",
      token,
      funcionario: {
        id: funcionario.id,
        nome: funcionario.nome,
        email: funcionario.email,
        permissoes: funcionario.permissoes,
      },
    };
  }
}

module.exports = new AuthService();
