const AuthService = require("../services/AuthService");

class AuthController {
  async login(req, res) {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: "E-mail e senha são obrigatórios" });
    }

    try {
      const { token, funcionario } = await AuthService.login(email, senha);
      return res.status(200).json({ token, funcionario });
    } catch (err) {
      return res.status(401).json({ erro: "Credenciais inválidas" });
    }
  }
}

module.exports = new AuthController();
