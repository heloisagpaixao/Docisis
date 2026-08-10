const pool = require('../config/database');

class CargoRepository {
    async findAll() {
        const [rows] = await pool.query('SELECT * FROM cargos ORDER BY id_cargo DESC');
        return rows;
    }

    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM cargos WHERE id_cargo = ?', [id]);
        return rows[0];
    }

    async create(cargoData) {
        const { permissoes, id_funcionario } = cargoData;
        const [result] = await pool.query(
            'INSERT INTO cargos (permissoes, id_funcionario) VALUES (?, ?)',
            [permissoes, id_funcionario]
        );
        return result.insertId;
    }

    async update(id, cargoData) {
        const fields = [];
        const values = [];
        for (const [key, value] of Object.entries(cargoData)) {
            fields.push(`${key} = ?`);
            values.push(value);
        }
        if (fields.length === 0) return null;

        values.push(id);
        const query = `UPDATE cargos SET ${fields.join(', ')} WHERE id_cargo = ?`;
        const [result] = await pool.query(query, values);
        return result.affectedRows;
    }

    async delete(id) {
        const [result] = await pool.query('DELETE FROM cargos WHERE id_cargo = ?', [id]);
        return result.affectedRows;
    }
}

module.exports = new CargoRepository();
