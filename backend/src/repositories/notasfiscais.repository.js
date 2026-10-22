const pool = require("../config/database");

class NotaFiscalRepository {
  async findAll({ page = 1, limit = 10, fornecedor } = {}) {
    let countSql = `SELECT COUNT(*) AS total FROM nota_fiscal WHERE 1=1`;
    let sql = `SELECT id_nota, dt_compra, fornecedor, quantidade, arquivo, criado_em FROM nota_fiscal WHERE 1=1`;
    const params = [];
    const countParams = [];

    if (fornecedor) {
      sql += " AND fornecedor LIKE ?";
      countSql += " AND fornecedor LIKE ?";
      const likeFornecedor = `%${fornecedor}%`;
      params.push(likeFornecedor);
      countParams.push(likeFornecedor);
    }

    const [[{ total }]] = await pool.query(countSql, countParams);

    const offset = (page - 1) * limit;
    sql += " ORDER BY id_nota DESC LIMIT ? OFFSET ?";
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
      "SELECT id_nota, dt_compra, fornecedor, quantidade, arquivo, criado_em FROM nota_fiscal WHERE id_nota = ?",
      [id],
    );
    return rows[0];
  }

  async create(notaData) {
    const { fornecedor, quantidade, dt_compra, arquivo } = notaData;
    const sql = `
      INSERT INTO nota_fiscal (fornecedor, quantidade, dt_compra, arquivo)
      VALUES (?, ?, ?, ?)
    `;
    // dt_compra é obrigatória no banco: se não vier, usa o momento do registro
    const params = [
      fornecedor,
      quantidade,
      dt_compra || new Date(),
      arquivo || null,
    ];

    const [result] = await pool.query(sql, params);
    return result.insertId;
  }

  /**
   * Update com whitelist de campos permitidos.
   */
  async update(id, notaData) {
    const allowedFields = ["fornecedor", "quantidade", "dt_compra", "arquivo"];
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(notaData)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    if (fields.length === 0) return null;

    values.push(id);
    const query = `UPDATE nota_fiscal SET ${fields.join(", ")} WHERE id_nota = ?`;
    const [result] = await pool.query(query, values);
    return result.affectedRows;
  }

  async delete(id) {
    const [result] = await pool.query(
      "DELETE FROM nota_fiscal WHERE id_nota = ?",
      [id],
    );
    return result.affectedRows;
  }

  /**
   * Verifica se existem lotes vinculados à nota fiscal.
   */
  async hasDependents(id) {
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS total FROM lotes WHERE id_nota = ?",
      [id],
    );
    return rows[0].total > 0;
  }
}

module.exports = new NotaFiscalRepository();
