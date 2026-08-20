const pool = require("../config/database");

class FuncionariosRepository {
  async findAll() {
    const [rows] = await pool.query(
      "SELECT * FROM funcionarios ORDER BY id DESC",
    );
    return rows;
  }

  async findById(id) {
    const [rows] = await pool.query("SELECT * FROM funcionarios WHERE id = ?", [
      id,
    ]);
    return rows[0];
  }

  async findByCpf(cpf) {
    const [rows] = await pool.query(
      "SELECT * FROM funcionarios WHERE cpf = ?",
      [cpf],
    );
    return rows[0];
  }

  async findByEmail(email) {
    const [rows] = await pool.query(
      "SELECT * FROM funcionarios WHERE email = ?",
      [email],
    );
    return rows[0];
  }

  async findByEmailAndCpf(email, cpf) {
    const [rows] = await pool.query(
      `SELECT f.*, c.permissoes 
       FROM funcionarios f 
       JOIN cargos c ON f.id_cargo = c.id_cargo 
       WHERE f.email = ? AND f.cpf = ?`,
      [email, cpf]
    );
    return rows[0];
  }

  async create(funcionario) {
    const sql = `
        INSERT INTO funcionarios (nome, cpf, email, telefone, id_cargo, foto_perfil, senha)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      funcionario.nome,
      funcionario.cpf,
      funcionario.email,
      funcionario.telefone,
      funcionario.id_cargo,
      funcionario.foto_perfil,
      funcionario.senha,
    ];

    // Corrigido de db.execute para pool.query
    const [result] = await pool.query(sql, params);
    return result.insertId;
  }

  async update(id, funcionariosData) {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(funcionariosData)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
    if (fields.length === 0) return null;

    values.push(id);
    const query = `UPDATE funcionarios SET ${fields.join(", ")} WHERE id = ?`;
    const [result] = await pool.query(query, values);
    return result.affectedRows;
  }

  async delete(id) {
    const [result] = await pool.query("DELETE FROM funcionarios WHERE id = ?", [
      id,
    ]);
    return result.affectedRows;
  }
}

module.exports = new FuncionariosRepository();
