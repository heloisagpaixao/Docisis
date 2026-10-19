const jwt = require("jsonwebtoken");

module.exports = function autenticar(req, res, next) {
  const [tipo, token] = (req.headers.authorization || "").split(" ");
  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ erro: "Token não informado" });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = { id: payload.id, cargo: payload.cargo };
    next();
  } catch {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }
};
