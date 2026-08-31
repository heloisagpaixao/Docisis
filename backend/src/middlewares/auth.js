const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      sucesso: false,
      mensagem: "Token não fornecido. Acesso não autorizado.",
    });
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2) {
    return res.status(401).json({
      sucesso: false,
      mensagem: "Erro no formato do token.",
    });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({
      sucesso: false,
      mensagem: "Token mal formatado.",
    });
  }

  const secret = process.env.JWT_SECRET || "super_secret_key_docisis_2026";

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Token inválido ou expirado.",
      });
    }

    req.funcionario = decoded;
    return next();
  });
};
