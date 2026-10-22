const pool = require("../config/database");

class LoteRepository {
  async findAll({ page = 1, limit = 10, id_produto } = {}) {
    let countSql = `SELECT COUNT(*) AS total FROM lotes l WHERE 1=1`;
    let sql = `
      SELECT l.id, l.quantidade, l.id_produto, l.dt_validade, l.id_nota, l.alterado_em,
             p.nome AS produto_nome, nf.fornecedor, nf.dt_compra
      FROM lotes l
      LEFT JOIN produtos p ON l.id_produto = p.id_produto
      LEFT JOIN nota_fiscal nf ON l.id_nota = nf.id_nota
      WHERE 1=1
    `;
    const params = [];
    const countParams = [];

    if (id_produto) {
      sql += " AND l.id_produto = ?";
      countSql += " AND l.id_produto = ?";
      params.push(id_produto);
      countParams.push(id_produto);
    }

    const [[{ total }]] = await pool.query(countSql, countParams);

    const offset = (page - 1) * limit;
    sql += " ORDER BY l.id DESC LIMIT ? OFFSET ?";
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
      `SELECT l.id, l.quantidade, l.id_produto, l.dt_validade, l.id_nota, l.alterado_em,
              p.nome AS produto_nome, nf.fornecedor, nf.dt_compra
       FROM lotes l
       LEFT JOIN produtos p ON l.id_produto = p.id_produto
       LEFT JOIN nota_fiscal nf ON l.id_nota = nf.id_nota
       WHERE l.id = ?`,
      [id],
    );
    return rows[0];
  }

  /**
   * Cadastra o lote e, se houver quantidade inicial, registra a ENTRADA
   * correspondente na MESMA transação. Assim o saldo nunca é somado duas vezes
   * e todo aumento de estoque fica no histórico (RF003).
   */
  async createComEntradaInicial({
    quantidade = 0,
    id_produto,
    dt_validade,
    id_nota,
    id_funcionario,
  }) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        "INSERT INTO lotes (quantidade, id_produto, dt_validade, id_nota) VALUES (?, ?, ?, ?)",
        [quantidade, id_produto, dt_validade, id_nota],
      );
      const idLote = result.insertId;

      if (quantidade > 0) {
        await connection.query(
          "INSERT INTO entradas (id_funcionario, id_lote, quantidade, motivo) VALUES (?, ?, ?, ?)",
          [id_funcionario, idLote, quantidade, "Entrada inicial do lote"],
        );
      }

      await connection.commit();
      return idLote;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async findVencendo(dias = 30) {
    const [rows] = await pool.query(
      `SELECT l.id, l.quantidade, l.id_produto, l.dt_validade, l.id_nota, l.alterado_em,
              p.nome AS produto_nome, nf.fornecedor
       FROM lotes l
       LEFT JOIN produtos p ON l.id_produto = p.id_produto
       LEFT JOIN nota_fiscal nf ON l.id_nota = nf.id_nota
       WHERE l.quantidade > 0 
         AND l.dt_validade <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
       ORDER BY l.dt_validade ASC`,
      [Number(dias)],
    );
    return rows;
  }

  async findMovimentacoes(idLote) {
    const sql = `
    SELECT 'ENTRADA' AS tipo, e.id_entrada AS id, e.dt_entrada AS data, e.motivo, e.quantidade, f.nome AS funcionario_nome
    FROM entradas e
    LEFT JOIN funcionarios f ON e.id_funcionario = f.id
    WHERE e.id_lote = ?

    UNION ALL

    SELECT 'SAIDA' AS tipo, s.id_saida AS id, s.dt_saida AS data, s.motivo, s.quantidade, f.nome AS funcionario_nome
    FROM saidas s
    LEFT JOIN funcionarios f ON s.id_funcionario = f.id
    WHERE s.id_lote = ?

    UNION ALL

    SELECT 'AJUSTE' AS tipo, a.id_ajuste AS id, a.dt_ajuste AS data, a.motivo, a.quantidade_ajuste AS quantidade, f.nome AS funcionario_nome
    FROM ajustes a
    LEFT JOIN funcionarios f ON a.id_funcionario = f.id
    WHERE a.id_lote = ?

    ORDER BY data DESC
  `;

    const [rows] = await pool.query(sql, [idLote, idLote, idLote]);
    return rows;
  }

  /**
   * Atualiza lote com whitelist de campos permitidos.
   * Campo 'quantidade' é BLOQUEADO — só pode ser alterado via Entrada/Saída/Ajuste.
   */
  async update(id, loteData) {
    const allowedFields = ["id_produto", "dt_validade", "id_nota"];
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(loteData)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    if (fields.length === 0) return null;

    values.push(id);
    const query = `UPDATE lotes SET ${fields.join(", ")} WHERE id = ?`;
    const [result] = await pool.query(query, values);
    return result.affectedRows;
  }

  async delete(id) {
    const [result] = await pool.query("DELETE FROM lotes WHERE id = ?", [id]);
    return result.affectedRows;
  }

  /**
   * Verifica se existem registros dependentes (entradas, saídas, ajustes) vinculados ao lote.
   */
  async hasDependents(id) {
    const [rows] = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM entradas WHERE id_lote = ?) +
        (SELECT COUNT(*) FROM saidas WHERE id_lote = ?) +
        (SELECT COUNT(*) FROM ajustes WHERE id_lote = ?) AS total`,
      [id, id, id],
    );
    return rows[0].total > 0;
  }
}

module.exports = new LoteRepository();
