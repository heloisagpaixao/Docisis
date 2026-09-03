const pool = require("../config/database");

class SaidaRepository {
  async findAll() {
    const [rows] = await pool.query(`
            SELECT s.*, f.nome AS funcionario_nome, l.materia_prima 
            FROM saidas s
            LEFT JOIN funcionarios f ON s.id_funcionario = f.id
            LEFT JOIN lotes l ON s.id_lote = l.id
            ORDER BY s.id_saida DESC
        `);
    return rows;
  }

  async findById(id) {
    const [rows] = await pool.query(
      `
            SELECT s.*, f.nome AS funcionario_nome, l.materia_prima 
            FROM saidas s
            LEFT JOIN funcionarios f ON s.id_funcionario = f.id
            LEFT JOIN lotes l ON s.id_lote = l.id
            WHERE s.id_saida = ?
        `,
      [id],
    );
    return rows[0];
  }

  /**
   * Registra uma saída e atualiza a quantidade do lote de forma atômica.
   * Usa transação para garantir consistência.
   */
  async create(saidaData) {
    const { dt_saida, id_funcionario, id_lote, quantidade, motivo } = saidaData;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verifica a quantidade disponível no lote
      const [loteRows] = await connection.query(
        "SELECT quantidade FROM lotes WHERE id = ?",
        [id_lote],
      );

      if (loteRows.length === 0) {
        throw { status: 404, mensagem: "Lote não encontrado." };
      }

      const quantidadeDisponivel = loteRows[0].quantidade;
      if (quantidade > quantidadeDisponivel) {
        throw {
          status: 400,
          mensagem: `Quantidade solicitada (${quantidade}) excede a disponível no lote (${quantidadeDisponivel}).`,
        };
      }

      // Insere o registro de saída
      const [saidaResult] = await connection.query(
        "INSERT INTO saidas (dt_saida, id_funcionario, id_lote, quantidade, motivo) VALUES (?, ?, ?, ?, ?)",
        [dt_saida || new Date(), id_funcionario, id_lote, quantidade, motivo],
      );
      const saidaId = saidaResult.insertId;

      // Atualiza a quantidade do lote
      const novaQuantidade = quantidadeDisponivel - quantidade;
      await connection.query("UPDATE lotes SET quantidade = ? WHERE id = ?", [
        novaQuantidade,
        id_lote,
      ]);

      await connection.commit();
      return saidaId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async update(id, saidaData) {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(saidaData)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
    if (fields.length === 0) return null;

    values.push(id);
    const query = `UPDATE saidas SET ${fields.join(", ")} WHERE id_saida = ?`;
    const [result] = await pool.query(query, values);
    return result.affectedRows;
  }

  async delete(id) {
    const [result] = await pool.query("DELETE FROM saidas WHERE id_saida = ?", [
      id,
    ]);
    return result.affectedRows;
  }
}

module.exports = new SaidaRepository();
