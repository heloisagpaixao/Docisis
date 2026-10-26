const pool = require("../config/database");

class EstoqueRepository {
  async findAll({ page = 1, limit = 10 } = {}) {
    const [[{ total }]] = await pool.query(
      "SELECT COUNT(*) AS total FROM lotes WHERE quantidade > 0",
    );

    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `SELECT 
          l.id AS id_lote,
          l.quantidade,
          l.id_produto,
          p.nome AS produto_nome,
          l.dt_validade,
          l.alterado_em,
          l.id_nota
       FROM lotes l
       LEFT JOIN produtos p ON l.id_produto = p.id_produto
       WHERE l.quantidade > 0
       ORDER BY l.id DESC
       LIMIT ? OFFSET ?`,
      [limit, offset],
    );

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
      `SELECT 
          l.id AS id_lote,
          l.quantidade,
          l.id_produto,
          p.nome AS produto_nome,
          l.dt_validade,
          l.alterado_em,
          l.id_nota
       FROM lotes l
       LEFT JOIN produtos p ON l.id_produto = p.id_produto
       WHERE l.id = ? AND l.quantidade > 0`,
      [id],
    );
    return rows[0];
  }

  async findByLoteId(id_lote) {
    return this.findById(id_lote);
  }

  async findBaixo(limite = 10) {
    const [rows] = await pool.query(
      `SELECT 
          l.id AS id_lote,
          l.quantidade,
          l.id_produto,
          p.nome AS produto_nome,
          l.dt_validade
       FROM lotes l
       LEFT JOIN produtos p ON l.id_produto = p.id_produto
       WHERE l.quantidade > 0 AND l.quantidade <= ?
       ORDER BY l.quantidade ASC`,
      [Number(limite)],
    );
    return rows;
  }
}

module.exports = new EstoqueRepository();
