const pool = require("../config/database");

class CargoRepository {
  async findAll({ page = 1, limit = 10 } = {}) {
    const [[{ total }]] = await pool.query(
      "SELECT COUNT(*) AS total FROM cargos",
    );

    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      "SELECT id_cargo, permissoes FROM cargos ORDER BY id_cargo ASC LIMIT ? OFFSET ?",
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
      "SELECT id_cargo, permissoes FROM cargos WHERE id_cargo = ?",
      [id],
    );
    return rows[0];
  }

  async create(cargo) {
    const { permissoes } = cargo;

    const [result] = await pool.query(
      "INSERT INTO cargos (permissoes) VALUES (?)",
      [permissoes],
    );

    return {
      id_cargo: result.insertId,
      permissoes,
    };
  }

  async update(id, cargo) {
    const { permissoes } = cargo;

    const [result] = await pool.query(
      "UPDATE cargos SET permissoes = ? WHERE id_cargo = ?",
      [permissoes, id],
    );

    return result;
  }

  async delete(id) {
    const [result] = await pool.query(
      "DELETE FROM cargos WHERE id_cargo = ?",
      [id],
    );
    return result;
  }

  /**
   * Verifica se existem funcionários vinculados ao cargo.
   */
  async hasDependents(id) {
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS total FROM funcionarios WHERE id_cargo = ?",
      [id],
    );
    return rows[0].total > 0;
  }
}

module.exports = new CargoRepository();
