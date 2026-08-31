const AuthService = require("../services/AuthService");

class AuthController {
  async login(req, res) {
    try {
      const { email, cpf, senha } = req.body;
      const resultado = await AuthService.login(email, cpf, senha);
      return res.status(200).json(resultado);
    } catch (erro) {
      return res.status(erro.status || 500).json({
        sucesso: false,
        mensagem: erro.mensagem || "Erro interno do servidor",
      });
    }
  }
}

module.exports = new AuthController();
