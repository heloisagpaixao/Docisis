const pool = require("../config/database");

class NotaFiscalRepository {
  async findAll() {
    const [rows] = await pool.query(
      "SELECT * FROM nota_fiscal ORDER BY id_nota DESC",
    );
    return rows;
  }

  async findById(id) {
    const [rows] = await pool.query(
      "SELECT * FROM nota_fiscal WHERE id_nota = ?",
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
    const params = [fornecedor, quantidade, dt_compra, arquivo || null];

    const [result] = await pool.query(sql, params);
    return result.insertId;
  }

  async update(id, notaData) {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(notaData)) {
      fields.push(`${key} = ?`);
      values.push(value);
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
}

module.exports = new NotaFiscalRepository();
