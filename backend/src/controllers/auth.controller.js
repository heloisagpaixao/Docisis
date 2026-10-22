const authService = require("../services/auth.service");

exports.login = async (req, res) => {
  const { email, senha } = req.body || {};

  if (
    typeof email !== "string" ||
    typeof senha !== "string" ||
    !email ||
    !senha
  ) {
    return res.status(400).json({ erro: "Informe e-mail e senha" });
  }

  const resultado = await authService.login(email.trim(), senha);
  if (!resultado) {
    return res.status(401).json({ erro: "E-mail ou senha inválidos" });
  }
  res.json(resultado);
};
