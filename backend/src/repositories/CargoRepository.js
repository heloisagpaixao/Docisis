const pool = require("../config/database");

class CargosRepository {
  async listar() {
    const [resultado] = await pool.query(
      "SELECT id_cargo, permissoes FROM cargos",
    );

    return resultado;
  }

  async buscarPorId(id) {
    const [resultado] = await pool.query(
      "SELECT id_cargo, permissoes FROM cargos WHERE id_cargo = ?",
      [id],
    );

    return resultado[0];
  }

  async cadastrar(cargo) {
    const { permissoes } = cargo;

    const [resultado] = await pool.query(
      "INSERT INTO cargos (permissoes) VALUES (?)",
      [permissoes],
    );

    return {
      id_cargo: resultado.insertId,
      permissoes,
    };
  }

  async atualizar(id, cargo) {
    const { permissoes } = cargo;

    const [resultado] = await pool.query(
      "UPDATE cargos SET permissoes = ? WHERE id_cargo = ?",
      [permissoes, id],
    );

    return resultado;
  }

  async deletar(id) {
    const [resultado] = await pool.query(
      "DELETE FROM cargos WHERE id_cargo = ?",
      [id],
    );

    return resultado;
  }
}

module.exports = new CargosRepository();
