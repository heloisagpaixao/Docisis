const pool = require('../config/database');

class NotaFiscalRepository {
    async findAll() {
        const [rows] = await pool.query(`
            SELECT nf.*, l.materia_prima, l.quantidade AS lote_quantidade 
            FROM nota_fiscal nf
            LEFT JOIN lotes l ON nf.id_lote = l.id
            ORDER BY nf.id_nota DESC
        `);
        return rows;
    }

    async findById(id) {
        const [rows] = await pool.query(`
            SELECT nf.*, l.materia_prima, l.quantidade AS lote_quantidade 
            FROM nota_fiscal nf
            LEFT JOIN lotes l ON nf.id_lote = l.id
            WHERE nf.id_nota = ?
        `, [id]);
        return rows[0];
    }

    async create(notaData) {
        const { id_lote, dt_compra, fornecedor, quantidade } = notaData;
        const [result] = await pool.query(
            'INSERT INTO nota_fiscal (id_lote, dt_compra, fornecedor, quantidade) VALUES (?, ?, ?, ?)',
            [id_lote, dt_compra || new Date(), fornecedor, quantidade]
        );
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
        const query = `UPDATE nota_fiscal SET ${fields.join(', ')} WHERE id_nota = ?`;
        const [result] = await pool.query(query, values);
        return result.affectedRows;
    }

    async delete(id) {
        const [result] = await pool.query('DELETE FROM nota_fiscal WHERE id_nota = ?', [id]);
        return result.affectedRows;
    }
}

module.exports = new NotaFiscalRepository();
