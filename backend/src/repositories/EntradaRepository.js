const pool = require("../config/database");

class EntradaRepository {
  async findAll() {
    const [rows] = await pool.query(`
          SELECT e.*, f.nome AS funcionario_nome, l.materia_prima 
          FROM entradas e
          LEFT JOIN funcionarios f ON e.id_funcionario = f.id
          LEFT JOIN lotes l ON e.id_lote = l.id
          ORDER BY e.id_entrada DESC
      `);
    return rows;
  }

  async findById(id) {
    const [rows] = await pool.query(
      `
          SELECT e.*, f.nome AS funcionario_nome, l.materia_prima 
          FROM entradas e
          LEFT JOIN funcionarios f ON e.id_funcionario = f.id
          LEFT JOIN lotes l ON e.id_lote = l.id
          WHERE e.id_entrada = ?
      `,
      [id],
    );
    return rows[0];
  }

  /**
   * Registra uma entrada e atualiza a quantidade do lote de forma atômica.
   * Usa transação para garantir consistência.
   */
  async create(entradaData) {
    const { dt_entrada, id_funcionario, id_lote, quantidade, motivo } =
      entradaData;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Verifica se o lote existe
      const [loteRows] = await connection.query(
        "SELECT id FROM lotes WHERE id = ?",
        [id_lote],
      );

      if (loteRows.length === 0) {
        throw { status: 404, mensagem: "Lote não encontrado." };
      }

      // 2. Insere o registro de entrada com a quantidade
      const [entradaResult] = await connection.query(
        "INSERT INTO entradas (dt_entrada, id_funcionario, id_lote, quantidade, motivo) VALUES (?, ?, ?, ?, ?)",
        [dt_entrada || new Date(), id_funcionario, id_lote, quantidade, motivo],
      );
      const entradaId = entradaResult.insertId;

      // 3. Incrementa a quantidade no lote correspondente
      await connection.query(
        "UPDATE lotes SET quantidade = quantidade + ? WHERE id = ?",
        [quantidade, id_lote],
      );

      await connection.commit();
      return entradaId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async update(id, entradaData) {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(entradaData)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
    if (fields.length === 0) return null;

    values.push(id);
    const query = `UPDATE entradas SET ${fields.join(", ")} WHERE id_entrada = ?`;
    const [result] = await pool.query(query, values);
    return result.affectedRows;
  }

  async delete(id) {
    const [result] = await pool.query(
      "DELETE FROM entradas WHERE id_entrada = ?",
      [id],
    );
    return result.affectedRows;
  }
}

module.exports = new EntradaRepository();
