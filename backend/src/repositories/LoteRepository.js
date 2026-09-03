const pool = require("../config/database");

class LoteRepository {
  async findAll() {
    const [rows] = await pool.query(`
            SELECT l.*, nf.fornecedor, nf.dt_compra 
            FROM lotes l
            LEFT JOIN nota_fiscal nf ON l.id_nota = nf.id_nota
            ORDER BY l.id DESC
        `);
    return rows;
  }

  async findById(id) {
    const [rows] = await pool.query(
      `
            SELECT l.*, nf.fornecedor, nf.dt_compra 
            FROM lotes l
            LEFT JOIN nota_fiscal nf ON l.id_nota = nf.id_nota
            WHERE l.id = ?
        `,
      [id],
    );
    return rows[0];
  }

  async create(loteData) {
    const { quantidade, materia_prima, dt_validade, id_nota } = loteData;
    const [result] = await pool.query(
      "INSERT INTO lotes (quantidade, materia_prima, dt_validade, id_nota) VALUES (?, ?, ?, ?)",
      [quantidade, materia_prima, dt_validade, id_nota],
    );
    return result.insertId;
  }

  async findVencendo(dias = 30) {
    const [rows] = await pool.query(
      `
        SELECT l.*, f.nome AS fornecedor_nome
        FROM lotes l
        LEFT JOIN fornecedores f ON l.id_fornecedor = f.id
        WHERE l.quantidade > 0 
          AND l.dt_validade <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
        ORDER BY l.dt_validade ASC
    `,
      [Number(dias)],
    );
    return rows;
  }

  async findMovimentacoes(idLote) {
    const sql = `
    SELECT 'ENTRADA' AS tipo, e.id_entrada AS id, e.dt_entrada AS data, e.motivo, NULL AS quantidade, f.nome AS funcionario_nome
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

  async update(id, loteData) {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(loteData)) {
      fields.push(`${key} = ?`);
      values.push(value);
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
}

module.exports = new LoteRepository();
