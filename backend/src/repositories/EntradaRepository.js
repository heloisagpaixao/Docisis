const pool = require("../config/database");

class EntradaRepository {
  async findAll({ page = 1, limit = 10, id_funcionario, id_lote, data_inicio, data_fim } = {}) {
    let countSql = `SELECT COUNT(*) AS total FROM entradas e WHERE 1=1`;
    let sql = `
      SELECT e.id_entrada, e.dt_entrada, e.id_funcionario, e.id_lote, e.quantidade, e.motivo,
             f.nome AS funcionario_nome, p.nome AS produto_nome
      FROM entradas e
      LEFT JOIN funcionarios f ON e.id_funcionario = f.id
      LEFT JOIN lotes l ON e.id_lote = l.id
      LEFT JOIN produtos p ON l.id_produto = p.id_produto
      WHERE 1=1
    `;
    const params = [];
    const countParams = [];

    if (id_funcionario) {
      sql += " AND e.id_funcionario = ?";
      countSql += " AND e.id_funcionario = ?";
      params.push(id_funcionario);
      countParams.push(id_funcionario);
    }

    if (id_lote) {
      sql += " AND e.id_lote = ?";
      countSql += " AND e.id_lote = ?";
      params.push(id_lote);
      countParams.push(id_lote);
    }

    if (data_inicio && data_fim) {
      sql += " AND e.dt_entrada BETWEEN ? AND ?";
      countSql += " AND e.dt_entrada BETWEEN ? AND ?";
      params.push(data_inicio, data_fim);
      countParams.push(data_inicio, data_fim);
    }

    const [[{ total }]] = await pool.query(countSql, countParams);

    const offset = (page - 1) * limit;
    sql += " ORDER BY e.id_entrada DESC LIMIT ? OFFSET ?";
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
      `SELECT e.id_entrada, e.dt_entrada, e.id_funcionario, e.id_lote, e.quantidade, e.motivo,
              f.nome AS funcionario_nome, p.nome AS produto_nome
       FROM entradas e
       LEFT JOIN funcionarios f ON e.id_funcionario = f.id
       LEFT JOIN lotes l ON e.id_lote = l.id
       LEFT JOIN produtos p ON l.id_produto = p.id_produto
       WHERE e.id_entrada = ?`,
      [id],
    );
    return rows[0];
  }

  /**
   * Registra uma entrada e atualiza a quantidade do lote de forma atômica.
   * Usa transação com SELECT ... FOR UPDATE para garantir consistência concorrente.
   */
  async create(entradaData) {
    const { dt_entrada, id_funcionario, id_lote, quantidade, motivo } = entradaData;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Trava a linha do lote para operação concorrente segura
      const [loteRows] = await connection.query(
        "SELECT quantidade FROM lotes WHERE id = ? FOR UPDATE",
        [id_lote],
      );

      if (loteRows.length === 0) {
        throw { status: 404, mensagem: "Lote não encontrado." };
      }

      // Atualiza o saldo do lote (incrementa)
      await connection.query(
        "UPDATE lotes SET quantidade = quantidade + ? WHERE id = ?",
        [quantidade, id_lote],
      );

      // Insere o registro de entrada
      const [result] = await connection.query(
        "INSERT INTO entradas (dt_entrada, id_funcionario, id_lote, quantidade, motivo) VALUES (?, ?, ?, ?, ?)",
        [dt_entrada || new Date(), id_funcionario, id_lote, quantidade, motivo],
      );

      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async update(id, entradaData) {
    const allowedFields = ["dt_entrada", "id_funcionario", "id_lote", "motivo"];
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(entradaData)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    if (fields.length === 0) return null;

    values.push(id);
    const query = `UPDATE entradas SET ${fields.join(", ")} WHERE id_entrada = ?`;
    const [result] = await pool.query(query, values);
    return result.affectedRows;
  }

  /**
   * Exclui uma entrada e devolve a quantidade ao lote de forma atômica.
   */
  async delete(id) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Busca a entrada para saber a quantidade e o lote
      const [entradaRows] = await connection.query(
        "SELECT id_lote, quantidade FROM entradas WHERE id_entrada = ?",
        [id],
      );

      if (entradaRows.length === 0) {
        throw { status: 404, mensagem: "Entrada não encontrada." };
      }

      const { id_lote, quantidade } = entradaRows[0];

      // Trava e atualiza o lote (decrementa a quantidade que foi adicionada)
      await connection.query(
        "SELECT quantidade FROM lotes WHERE id = ? FOR UPDATE",
        [id_lote],
      );

      await connection.query(
        "UPDATE lotes SET quantidade = GREATEST(quantidade - ?, 0) WHERE id = ?",
        [quantidade, id_lote],
      );

      // Exclui a entrada
      const [result] = await connection.query(
        "DELETE FROM entradas WHERE id_entrada = ?",
        [id],
      );

      await connection.commit();
      return result.affectedRows;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new EntradaRepository();
