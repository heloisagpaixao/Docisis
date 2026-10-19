const pool = require("../config/database");

async function listar({ nome, codigo } = {}) {
  const filtros = [];
  const valores = [];
  if (nome) {
    filtros.push("nome LIKE ?");
    valores.push(`%${nome}%`);
  }
  if (codigo) {
    filtros.push("codigo = ?");
    valores.push(codigo);
  }
  const where = filtros.length ? `WHERE ${filtros.join(" AND ")}` : "";
  const [rows] = await pool.query(
    `SELECT * FROM produtos ${where} ORDER BY nome`,
    valores,
  );
  return rows;
}

async function buscarPorId(id) {
  const [rows] = await pool.query(
    "SELECT * FROM produtos WHERE id_produto = ?",
    [id],
  );
  return rows[0] || null;
}

async function inserir({ nome, dt_validade, codigo, peso, imagem }) {
  const [r] = await pool.query(
    "INSERT INTO produtos (nome, dt_validade, codigo, peso, imagem) VALUES (?, ?, ?, ?, ?)",
    [nome, dt_validade, codigo, peso, imagem],
  );
  return r.insertId;
}

// Recebe só os campos já filtrados pelo service
async function atualizar(id, campos) {
  const colunas = Object.keys(campos);
  const [r] = await pool.query(
    `UPDATE produtos SET ${colunas.map((c) => `${c} = ?`).join(", ")} WHERE id_produto = ?`,
    [...Object.values(campos), id],
  );
  return r.affectedRows > 0;
}

async function excluir(id) {
  const [r] = await pool.query("DELETE FROM produtos WHERE id_produto = ?", [
    id,
  ]);
  return r.affectedRows > 0;
}

module.exports = { listar, buscarPorId, inserir, atualizar, excluir };
