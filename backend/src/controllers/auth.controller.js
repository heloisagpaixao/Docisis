const authService = require("../services/auth.service");

exports.login = async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: "Informe e-mail e senha" });
  }

  try {
    const resultado = await authService.login(email, senha);
    if (!resultado) {
      return res.status(401).json({ erro: "E-mail ou senha inválidos" });
    }
    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
};
