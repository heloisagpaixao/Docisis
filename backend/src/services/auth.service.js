const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

async function login(email, senha) {
  const [rows] = await pool.query(
    `SELECT f.id, f.nome, f.email, f.senha, c.nome AS cargo
     FROM funcionarios f
     JOIN cargos c ON c.id_cargo = f.id_cargo
     WHERE f.email = ?`,
    [email],
  );
  const funcionario = rows[0];
  const senhaOk =
    funcionario && (await bcrypt.compare(senha, funcionario.senha));
  if (!senhaOk) return null;

  const token = jwt.sign(
    { id: funcionario.id, cargo: funcionario.cargo },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" },
  );

  const [perms] = await pool.query(
    "SELECT permissao FROM vw_permissoes_funcionario WHERE id_funcionario = ?",
    [funcionario.id],
  );

  return {
    token,
    funcionario: {
      id: funcionario.id,
      nome: funcionario.nome,
      email: funcionario.email,
      cargo: funcionario.cargo,
    },
    permissoes: perms.map((p) => p.permissao),
  };
}

module.exports = { login };
