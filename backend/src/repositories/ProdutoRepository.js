const pool = require("../config/database");

class ProdutoRepository {
  async findAll({ page = 1, limit = 10, nome } = {}) {
    let countSql = `SELECT COUNT(*) AS total FROM produtos WHERE 1=1`;
    let sql = `SELECT id_produto, nome, dt_validade, codigo, peso, imagem, criado_em, alterado_em FROM produtos WHERE 1=1`;
    const params = [];
    const countParams = [];

    if (nome) {
      sql += " AND nome LIKE ?";
      countSql += " AND nome LIKE ?";
      const likeName = `%${nome}%`;
      params.push(likeName);
      countParams.push(likeName);
    }

    const [[{ total }]] = await pool.query(countSql, countParams);

    const offset = (page - 1) * limit;
    sql += " ORDER BY id_produto DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows] = await pool.query(sql, params);

    return {
      dados: rows,
      total,
      pagina: page,
      limite: limit,
      totalPaginas: Math.ceil(total / limit),
    };
  }

  async findById(id) {
    const [rows] = await pool.query(
      "SELECT id_produto, nome, dt_validade, codigo, peso, imagem, criado_em, alterado_em FROM produtos WHERE id_produto = ?",
      [id],
    );
    return rows[0];
  }

  async findByCodigo(codigo) {
    const [rows] = await pool.query(
      "SELECT id_produto, nome, dt_validade, codigo, peso, imagem, criado_em, alterado_em FROM produtos WHERE codigo = ?",
      [codigo],
    );
    return rows[0];
  }

  async create(produtoData) {
    const { nome, dt_validade, codigo, peso, imagem } = produtoData;
    const [result] = await pool.query(
      "INSERT INTO produtos (nome, dt_validade, codigo, peso, imagem) VALUES (?, ?, ?, ?, ?)",
      [nome, dt_validade, codigo, peso || null, imagem || null],
    );
    return result.insertId;
  }

  /**
   * Update com whitelist de campos permitidos.
   */
  async update(id, produtoData) {
    const allowedFields = ["nome", "dt_validade", "codigo", "peso", "imagem"];
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
    const query = `UPDATE produtos SET ${fields.join(", ")} WHERE id_produto = ?`;
    const [result] = await pool.query(query, values);
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
