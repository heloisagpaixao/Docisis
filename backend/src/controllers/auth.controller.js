const authService = require("../services/auth.service");

// O refresh token tem 64 caracteres; limites generosos só para recusar lixo
const refreshValido = (t) =>
  typeof t === "string" && t.length >= 20 && t.length <= 200;

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

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshValido(refreshToken)) {
    return res.status(400).json({ erro: "Informe o refreshToken" });
  }
  res.json(await authService.renovar(refreshToken));
};

exports.logout = async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshValido(refreshToken)) {
    return res.status(400).json({ erro: "Informe o refreshToken" });
  }
  await authService.logout(refreshToken);
  res.status(204).send();
};

exports.logoutTodos = async (req, res) => {
  res.json({ revogados: await authService.logoutTodos(req.usuario.id) });
};
