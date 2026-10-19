const pool = require("../config/database");

class SaidaRepository {
  async findAll({ page = 1, limit = 10, id_funcionario, id_lote, data_inicio, data_fim } = {}) {
    let countSql = `SELECT COUNT(*) AS total FROM saidas s WHERE 1=1`;
    let sql = `
      SELECT s.id_saida, s.dt_saida, s.id_funcionario, s.id_lote, s.quantidade, s.motivo,
             f.nome AS funcionario_nome, p.nome AS produto_nome
      FROM saidas s
      LEFT JOIN funcionarios f ON s.id_funcionario = f.id
      LEFT JOIN lotes l ON s.id_lote = l.id
      LEFT JOIN produtos p ON l.id_produto = p.id_produto
      WHERE 1=1
    `;
    const params = [];
    const countParams = [];

    if (id_funcionario) {
      sql += " AND s.id_funcionario = ?";
      countSql += " AND s.id_funcionario = ?";
      params.push(id_funcionario);
      countParams.push(id_funcionario);
    }

    if (id_lote) {
      sql += " AND s.id_lote = ?";
      countSql += " AND s.id_lote = ?";
      params.push(id_lote);
      countParams.push(id_lote);
    }

    if (data_inicio && data_fim) {
      sql += " AND s.dt_saida BETWEEN ? AND ?";
      countSql += " AND s.dt_saida BETWEEN ? AND ?";
      params.push(data_inicio, data_fim);
      countParams.push(data_inicio, data_fim);
    }

    const [[{ total }]] = await pool.query(countSql, countParams);

    const offset = (page - 1) * limit;
    sql += " ORDER BY s.id_saida DESC LIMIT ? OFFSET ?";
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
      `SELECT s.id_saida, s.dt_saida, s.id_funcionario, s.id_lote, s.quantidade, s.motivo,
              f.nome AS funcionario_nome, p.nome AS produto_nome
       FROM saidas s
       LEFT JOIN funcionarios f ON s.id_funcionario = f.id
       LEFT JOIN lotes l ON s.id_lote = l.id
       LEFT JOIN produtos p ON l.id_produto = p.id_produto
       WHERE s.id_saida = ?`,
      [id],
    );
    return rows[0];
  }

  /**
   * Registra uma saída e atualiza a quantidade do lote de forma atômica.
   * Usa transação com SELECT ... FOR UPDATE para garantir consistência concorrente.
   */
  async create(saidaData) {
    const { dt_saida, id_funcionario, id_lote, quantidade, motivo } = saidaData;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Trava a linha do lote com FOR UPDATE para evitar race condition
      const [loteRows] = await connection.query(
        "SELECT quantidade FROM lotes WHERE id = ? FOR UPDATE",
        [id_lote],
      );

      if (loteRows.length === 0) {
        throw { status: 404, mensagem: "Lote não encontrado." };
      }

      // Atualização atômica: verifica e decrementa em uma única operação
      const [updateResult] = await connection.query(
        "UPDATE lotes SET quantidade = quantidade - ? WHERE id = ? AND quantidade >= ?",
        [quantidade, id_lote, quantidade],
      );

      if (updateResult.affectedRows === 0) {
        const quantidadeDisponivel = loteRows[0].quantidade;
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

      await connection.commit();
      return saidaResult.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Atualiza uma saída e reajusta o saldo do lote de forma atômica.
   * Calcula o delta entre quantidade anterior e nova para ajustar o lote.
   */
  async update(id, saidaData) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Busca a saída anterior
      const [saidaRows] = await connection.query(
        "SELECT id_lote, quantidade FROM saidas WHERE id_saida = ?",
        [id],
      );

      if (saidaRows.length === 0) {
        throw { status: 404, mensagem: "Saída não encontrada." };
      }

      const saidaAnterior = saidaRows[0];
      const idLoteAtual = saidaData.id_lote || saidaAnterior.id_lote;

      // Se a quantidade está sendo alterada, ajusta o lote
      if (saidaData.quantidade !== undefined) {
        const quantidadeAnterior = saidaAnterior.quantidade;
        const quantidadeNova = saidaData.quantidade;
        const delta = quantidadeNova - quantidadeAnterior;

        if (delta !== 0) {
          // Trava o lote
          const [loteRows] = await connection.query(
            "SELECT quantidade FROM lotes WHERE id = ? FOR UPDATE",
            [idLoteAtual],
          );

          if (loteRows.length === 0) {
            throw { status: 404, mensagem: "Lote não encontrado." };
          }

          if (delta > 0) {
            // Precisa retirar mais do lote
            const [updateResult] = await connection.query(
              "UPDATE lotes SET quantidade = quantidade - ? WHERE id = ? AND quantidade >= ?",
              [delta, idLoteAtual, delta],
            );

            if (updateResult.affectedRows === 0) {
              throw {
                status: 400,
                mensagem: `Estoque insuficiente no lote para o aumento da saída.`,
              };
            }
          } else {
            // Devolve a diferença ao lote
            await connection.query(
              "UPDATE lotes SET quantidade = quantidade + ? WHERE id = ?",
              [Math.abs(delta), idLoteAtual],
            );
          }
        }
      }

      // Monta o UPDATE com whitelist
      const allowedFields = ["dt_saida", "id_funcionario", "id_lote", "quantidade", "motivo"];
      const fields = [];
      const values = [];

      for (const [key, value] of Object.entries(saidaData)) {
        if (allowedFields.includes(key)) {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (fields.length > 0) {
        values.push(id);
        const query = `UPDATE saidas SET ${fields.join(", ")} WHERE id_saida = ?`;
        await connection.query(query, values);
      }

      await connection.commit();
      return 1;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Exclui uma saída e devolve a quantidade ao lote de forma atômica.
   */
  async delete(id) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Busca a saída para saber a quantidade e o lote
      const [saidaRows] = await connection.query(
        "SELECT id_lote, quantidade FROM saidas WHERE id_saida = ?",
        [id],
      );

      if (saidaRows.length === 0) {
        throw { status: 404, mensagem: "Saída não encontrada." };
      }

      const { id_lote, quantidade } = saidaRows[0];

      // Trava e devolve a quantidade ao lote
      await connection.query(
        "SELECT quantidade FROM lotes WHERE id = ? FOR UPDATE",
        [id_lote],
      );

      await connection.query(
        "UPDATE lotes SET quantidade = quantidade + ? WHERE id = ?",
        [quantidade, id_lote],
      );

      // Exclui a saída
      const [result] = await connection.query(
        "DELETE FROM saidas WHERE id_saida = ?",
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

module.exports = new SaidaRepository();
