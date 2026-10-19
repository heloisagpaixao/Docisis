const bcrypt = require("bcrypt");
const pool = require("../config/database");

const SELECT = `
  SELECT f.id, f.nome, f.cpf, f.email, f.telefone, f.id_cargo,
         c.nome AS cargo, f.foto_perfil, f.criado_em
  FROM funcionarios f
  JOIN cargos c ON c.id_cargo = f.id_cargo`;

async function listar() {
  const [rows] = await pool.query(`${SELECT} ORDER BY f.nome`);
  return rows;
}

async function buscarPorId(id) {
  const [rows] = await pool.query(`${SELECT} WHERE f.id = ?`, [id]);
  return rows[0] || null;
}

async function criar({ nome, cpf, email, senha, telefone, id_cargo }) {
  const hash = await bcrypt.hash(senha, 10);
  const [r] = await pool.query(
    `INSERT INTO funcionarios (nome, cpf, email, senha, telefone, id_cargo)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [nome, cpf, email, hash, telefone, id_cargo],
  );
  return buscarPorId(r.insertId);
}

async function atualizar(id, dados) {
  const permitidos = ["nome", "email", "telefone", "foto_perfil"];
  const campos = [];
  const valores = [];
  for (const campo of permitidos) {
    if (dados[campo] !== undefined) {
      campos.push(`${campo} = ?`);
      valores.push(dados[campo]);
    }
  }
  if (dados.senha) {
    campos.push("senha = ?");
    valores.push(await bcrypt.hash(dados.senha, 10));
  }
  if (campos.length === 0) return buscarPorId(id);

  const [r] = await pool.query(
    `UPDATE funcionarios SET ${campos.join(", ")} WHERE id = ?`,
    [...valores, id],
  );
  return r.affectedRows ? buscarPorId(id) : null;
}

async function alterarCargo(id, id_cargo) {
  const [r] = await pool.query(
    "UPDATE funcionarios SET id_cargo = ? WHERE id = ?",
    [id_cargo, id],
  );
  return r.affectedRows ? buscarPorId(id) : null;
}

async function excluir(id) {
  const [r] = await pool.query("DELETE FROM funcionarios WHERE id = ?", [id]);
  return r.affectedRows > 0;
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  alterarCargo,
  excluir,
};
