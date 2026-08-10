const pool = require('../config/database');

class FuncionarioRepository {
    async findAll() {
        const [rows] = await pool.query(`
            SELECT f.*, c.permissoes 
            FROM funcionarios f
            LEFT JOIN cargos c ON f.id_cargo = c.id_cargo
            ORDER BY f.id DESC
        `);
        return rows;
    }

    async findById(id) {
        const [rows] = await pool.query(`
            SELECT f.*, c.permissoes 
            FROM funcionarios f
            LEFT JOIN cargos c ON f.id_cargo = c.id_cargo
            WHERE f.id = ?
        `, [id]);
        return rows[0];
    }

    async findByCpf(cpf) {
        const [rows] = await pool.query('SELECT * FROM funcionarios WHERE cpf = ?', [cpf]);
        return rows[0];
    }

    async findByEmail(email) {
        const [rows] = await pool.query('SELECT * FROM funcionarios WHERE email = ?', [email]);
        return rows[0];
    }

    async create(funcionarioData) {
        const { nome, cpf, email, telefone, id_cargo } = funcionarioData;
        const [result] = await pool.query(
            'INSERT INTO funcionarios (nome, cpf, email, telefone, id_cargo) VALUES (?, ?, ?, ?, ?)',
            [nome, cpf, email, telefone, id_cargo]
        );
        return result.insertId;
    }

    async update(id, funcionarioData) {
        const fields = [];
        const values = [];
        for (const [key, value] of Object.entries(funcionarioData)) {
            fields.push(`${key} = ?`);
            values.push(value);
        }
        if (fields.length === 0) return null;

        values.push(id);
        const query = `UPDATE funcionarios SET ${fields.join(', ')} WHERE id = ?`;
        const [result] = await pool.query(query, values);
        return result.affectedRows;
    }

    async delete(id) {
        const [result] = await pool.query('DELETE FROM funcionarios WHERE id = ?', [id]);
        return result.affectedRows;
    }
}

module.exports = new FuncionarioRepository();
