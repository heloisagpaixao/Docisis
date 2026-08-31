const pool = require('../config/database');

class ProdutoRepository {
    async findAll() {
        const [rows] = await pool.query('SELECT * FROM produtos ORDER BY id_produto DESC');
        return rows;
    }

    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM produtos WHERE id_produto = ?', [id]);
        return rows[0];
    }

    async findByCodigo(codigo) {
        const [rows] = await pool.query('SELECT * FROM produtos WHERE codigo = ?', [codigo]);
        return rows[0];
    }

    async create(produtoData) {
        const { nome, dt_validade, codigo, peso } = produtoData;
        const [result] = await pool.query(
            'INSERT INTO produtos (nome, dt_validade, codigo, peso) VALUES (?, ?, ?, ?)',
            [nome, dt_validade, codigo, peso]
        );
        return result.insertId;
    }

    async update(id, produtoData) {
        const fields = [];
        const values = [];
        for (const [key, value] of Object.entries(produtoData)) {
            fields.push(`${key} = ?`);
            values.push(value);
        }
        if (fields.length === 0) return null;

        values.push(id);
        const query = `UPDATE produtos SET ${fields.join(', ')} WHERE id_produto = ?`;
        const [result] = await pool.query(query, values);
        return result.affectedRows;
    }

    async delete(id) {
        const [result] = await pool.query('DELETE FROM produtos WHERE id_produto = ?', [id]);
        return result.affectedRows;
    }
}

module.exports = new ProdutoRepository();
