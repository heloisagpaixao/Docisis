const pool = require("../config/database");

class CargosRepository {
  async listar() {
    const [resultado] = await pool.query(
      "SELECT id_cargo, permissoes, id_funcionario FROM cargos"
    );

    return resultado;
  }

  async buscarPorId(id) {
    const [resultado] = await pool.query(
      "SELECT id_cargo, permissoes, id_funcionario FROM cargos WHERE id_cargo = ?",
      [id]
    );

    return resultado[0];
  }

  async cadastrar(cargo) {
    const { permissoes, id_funcionario } = cargo;

    const [resultado] = await pool.query(
      "INSERT INTO cargos (permissoes, id_funcionario) VALUES (?, ?)",
      [permissoes, id_funcionario]
    );

    return {
      id_cargo: resultado.insertId,
      permissoes,
      id_funcionario,
    };
  }

  async atualizar(id, cargo) {
    const { permissoes, id_funcionario } = cargo;

    const [resultado] = await pool.query(
      "UPDATE cargos SET permissoes = ?, id_funcionario = ? WHERE id_cargo = ?",
      [permissoes, id_funcionario, id]
    );

    return resultado;
  }

  async deletar(id) {
    const [resultado] = await pool.query(
      "DELETE FROM cargos WHERE id_cargo = ?",
      [id]
    );

    return resultado;
  }
}

module.exports = new CargosRepository();