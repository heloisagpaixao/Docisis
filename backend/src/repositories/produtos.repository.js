const pool = require("../config/database");

// A validade pertence ao LOTE; por isso dt_validade não é lida nem gravada aqui.
const COLUNAS =
  "id_produto, nome, codigo, peso, imagem, criado_em, alterado_em";

// O MySQL devolve DECIMAL como texto ("5.00"); aqui vira número
const formatar = (row) =>
  row && { ...row, peso: row.peso === null ? null : Number(row.peso) };

class ProdutoRepository {
  async findAll({ page = 1, limit = 10, nome, codigo } = {}) {
    const filtros = [];
    const params = [];

    if (nome) {
      filtros.push("nome LIKE ?");
      params.push(`%${nome}%`);
    }
    if (codigo) {
      filtros.push("codigo = ?");
      params.push(codigo);
    }
    const where = filtros.length ? `WHERE ${filtros.join(" AND ")}` : "";

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM produtos ${where}`,
      params,
    );

    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `SELECT ${COLUNAS} FROM produtos ${where} ORDER BY nome ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    return {
      dados: rows.map(formatar),
      total,
      pagina: page,
      limite: limit,
      totalPaginas: Math.ceil(total / limit),
    };
  }

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT ${COLUNAS} FROM produtos WHERE id_produto = ?`,
      [id],
    );
    return formatar(rows[0]);
  }

  async findByCodigo(codigo) {
    const [rows] = await pool.query(
      `SELECT ${COLUNAS} FROM produtos WHERE codigo = ?`,
      [codigo],
    );
    return formatar(rows[0]);
  }

  async create({ nome, codigo, peso = null, imagem = null }) {
    const [result] = await pool.query(
      "INSERT INTO produtos (nome, codigo, peso, imagem) VALUES (?, ?, ?, ?)",
      [nome, codigo, peso, imagem],
    );
    return result.insertId;
  }

  /**
   * Update com whitelist de campos permitidos.
   */
  async update(id, produtoData) {
    const allowedFields = ["nome", "codigo", "peso", "imagem"];
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(produtoData)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    if (fields.length === 0) return null;

    values.push(id);
    const [result] = await pool.query(
      `UPDATE produtos SET ${fields.join(", ")} WHERE id_produto = ?`,
      values,
    );
    return result.affectedRows;
  }

  async delete(id) {
    const [result] = await pool.query(
      "DELETE FROM produtos WHERE id_produto = ?",
      [id],
    );
    return result.affectedRows;
  }

  /**
   * Verifica se existem lotes vinculados ao produto.
   */
  async hasDependents(id) {
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS total FROM lotes WHERE id_produto = ?",
      [id],
    );
    return rows[0].total > 0;
  }
}

module.exports = new ProdutoRepository();
