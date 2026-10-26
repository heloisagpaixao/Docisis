// src/middlewares/permissao.js
const pool = require("../config/database");

module.exports = function exigirPermissao(nomePermissao) {
  return async (req, res, next) => {
    const [rows] = await pool.query(
      "SELECT 1 FROM vw_permissoes_funcionario WHERE id_funcionario = ? AND permissao = ?",
      [req.usuario.id, nomePermissao],
    );
    if (rows.length === 0) {
      return res.status(403).json({ erro: "Sem permissão para esta ação" });
    }
    next();
  };
};
