const authService = require("../services/auth.service");

// O refresh token tem 64 caracteres; limites generosos só para recusar lixo
const refreshValido = (t) =>
  typeof t === "string" && t.length >= 20 && t.length <= 200;

exports.login = async (req, res) => {
  const { cpf, email, senha } = req.body || {};

  if (typeof senha !== "string" || !senha) {
    return res
      .status(400)
      .json({ erro: "Informe o CPF (ou e-mail) e a senha" });
  }

  let identificador;
  if (typeof cpf === "string" && cpf.trim()) {
    const digitos = cpf.replace(/\D/g, "");
    if (digitos.length !== 11)
      return res.status(400).json({ erro: "Informe um CPF com 11 dígitos" });
    identificador = { cpf: digitos };
  } else if (typeof email === "string" && email.trim()) {
    identificador = { email: email.trim() };
  } else {
    return res
      .status(400)
      .json({ erro: "Informe o CPF (ou e-mail) e a senha" });
  }

  const resultado = await authService.login(identificador, senha);
  if (!resultado) {
    return res.status(401).json({ erro: "Usuário ou senha inválidos" });
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
