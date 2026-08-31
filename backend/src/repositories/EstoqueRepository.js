const pool = require("../config/database");

class EstoqueRepository {
  async findAll() {
    const [rows] = await pool.query(`
            SELECT 
                l.id AS id_estoque,
                l.id AS id_lote,
                l.quantidade, 
                l.materia_prima, 
                l.dt_validade,
                l.dt_criacao,
                l.id_fornecedor
            FROM lotes l
            WHERE l.quantidade > 0
            ORDER BY l.id DESC
        `);
    return rows;
  }

  async findById(id) {
    const [rows] = await pool.query(
      `
            SELECT 
                l.id AS id_estoque,
                l.id AS id_lote,
                l.quantidade, 
                l.materia_prima, 
                l.dt_validade,
                l.dt_criacao,
                l.id_fornecedor
            FROM lotes l
            WHERE l.id = ? AND l.quantidade > 0
        `,
      [id],
    );
    return rows[0];
  }

  async findByLoteId(id_lote) {
    return this.findById(id_lote);
  }

  async findBaixo(limite = 10) {
    const [rows] = await pool.query(
      `
        SELECT 
            l.id AS id_estoque,
            l.id AS id_lote,
            l.quantidade, 
            l.materia_prima, 
            l.dt_validade
        FROM lotes l
        WHERE l.quantidade > 0 AND l.quantidade <= ?
        ORDER BY l.quantidade ASC
    `,
      [Number(limite)],
    );
    return rows;
  }
}

module.exports = new EstoqueRepository();
