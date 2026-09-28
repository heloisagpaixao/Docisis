const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      sucesso: false,
      mensagem: "Token não fornecido. Acesso não autorizado.",
      erro: "Token não fornecido",
    });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2) {
    return res.status(401).json({
      sucesso: false,
      mensagem: "Erro no formato do token.",
      erro: "Formato de token inválido",
    });
  }

  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme) || !token) {
    return res.status(401).json({
      sucesso: false,
      mensagem: "Token mal formatado.",
      erro: "Formato de token inválido",
    });
  }

  const secret = process.env.JWT_SECRET || "chave_super_secreta_docisis_2026";

  try {
    const payload = jwt.verify(token, secret);

    const usuario = {
      id: payload.id,
      nome: payload.nome,
      email: payload.email,
      id_cargo: payload.id_cargo,
      permissoes: payload.permissoes,
    };

    req.user = usuario;
    req.funcionario = usuario;

    return next();
  } catch (err) {
    return res.status(401).json({
      sucesso: false,
      mensagem: "Token inválido ou expirado.",
      erro: "Token inválido ou expirado",
    });
  }
}

module.exports = authMiddleware;

