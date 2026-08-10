const pool = require('../config/database');

class EstoqueRepository {
    async findAll() {
        const [rows] = await pool.query(`
            SELECT e.*, l.quantidade, l.materia_prima, l.dt_validade 
            FROM estoque e
            LEFT JOIN lotes l ON e.id_lote = l.id
            ORDER BY e.id_estoque DESC
        `);
        return rows;
    }

    async findById(id) {
        const [rows] = await pool.query(`
            SELECT e.*, l.quantidade, l.materia_prima, l.dt_validade 
            FROM estoque e
            LEFT JOIN lotes l ON e.id_lote = l.id
            WHERE e.id_estoque = ?
        `, [id]);
        return rows[0];
    }

    async findByLoteId(id_lote) {
        const [rows] = await pool.query('SELECT * FROM estoque WHERE id_lote = ?', [id_lote]);
        return rows[0];
    }

    async create(estoqueData) {
        const { id_lote } = estoqueData;
        const [result] = await pool.query(
            'INSERT INTO estoque (id_lote) VALUES (?)',
            [id_lote]
        );
        return result.insertId;
    }

    async update(id, estoqueData) {
        const fields = [];
        const values = [];
        for (const [key, value] of Object.entries(estoqueData)) {
            fields.push(`${key} = ?`);
            values.push(value);
        }
        if (fields.length === 0) return null;

        values.push(id);
        const query = `UPDATE estoque SET ${fields.join(', ')} WHERE id_estoque = ?`;
        const [result] = await pool.query(query, values);
        return result.affectedRows;
    }

    async delete(id) {
        const [result] = await pool.query('DELETE FROM estoque WHERE id_estoque = ?', [id]);
        return result.affectedRows;
    }
}

module.exports = new EstoqueRepository();
