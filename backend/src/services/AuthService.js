const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const FuncionarioRepository = require("../repositories/FuncionarioRepository");

class AuthService {
  async login(email, cpf, senha) {
    // Permitir chamada com (email, senha) se cpf for omitido ou for a senha
    if (!senha && cpf) {
      senha = cpf;
      cpf = null;
    }

    if (!email || !senha) {
      throw { status: 400, mensagem: "E-mail e senha são obrigatórios." };
    }

    const emailLimpo = String(email).trim().toLowerCase();
    const cpfLimpo = cpf ? String(cpf).trim() : null;

    let funcionario = null;
    if (cpfLimpo) {
      funcionario = await FuncionarioRepository.findByEmailAndCpf(emailLimpo, cpfLimpo);
    }
    if (!funcionario) {
      funcionario = await FuncionarioRepository.findByEmailWithCargo(emailLimpo);
    }

    if (!funcionario || !funcionario.senha) {
      throw { status: 401, mensagem: "Credenciais inválidas." };
    }

    const senhaValida = await bcrypt.compare(senha, funcionario.senha);
    if (!senhaValida) {
      throw { status: 401, mensagem: "Credenciais inválidas." };
    }

    const payload = {
      id: funcionario.id,
      nome: funcionario.nome,
      email: funcionario.email,
      id_cargo: funcionario.id_cargo,
      permissoes: funcionario.permissoes,
    };

    const secret = process.env.JWT_SECRET || "chave_super_secreta_docisis_2026";
    const token = jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || "8h",
    });

    const funcionarioSemSenha = { ...funcionario };
    delete funcionarioSemSenha.senha;

    return {
      sucesso: true,
      mensagem: "Login realizado com sucesso.",
      token,
      funcionario: funcionarioSemSenha,
    };
  }

  async hashSenha(senhaPlana) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(senhaPlana, salt);
  }
}

module.exports = new AuthService();

