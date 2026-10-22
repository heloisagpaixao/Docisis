const pool = require("../config/database");

const SELECT_CARGO = `
  SELECT c.id_cargo, c.nome,
         GROUP_CONCAT(p.nome ORDER BY p.nome) AS permissoes
  FROM cargos c
  LEFT JOIN cargo_permissoes cp ON cp.id_cargo = c.id_cargo
  LEFT JOIN permissoes p ON p.id_permissao = cp.id_permissao
`;

// GROUP_CONCAT devolve texto; transforma em lista de nomes
const formatar = (row) =>
  row && {
    ...row,
    permissoes: row.permissoes ? row.permissoes.split(",") : [],
  };

class CargoRepository {
  async findAll({ page = 1, limit = 10 } = {}) {
    const [[{ total }]] = await pool.query(
      "SELECT COUNT(*) AS total FROM cargos",
    );

    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `${SELECT_CARGO}
       GROUP BY c.id_cargo, c.nome
       ORDER BY c.id_cargo ASC
       LIMIT ? OFFSET ?`,
      [limit, offset],
    );

    return {
      dados: rows.map(formatar),
      total,
      pagina: page,
      limite: limit,
      totalPaginas: Math.ceil(total / limit),
    };
  }

  async findById(id) {
    const [rows] = await pool.query(
      `${SELECT_CARGO}
       WHERE c.id_cargo = ?
       GROUP BY c.id_cargo, c.nome`,
      [id],
    );
    return formatar(rows[0]);
  }

  async findByNome(nome) {
    const [rows] = await pool.query(
      "SELECT id_cargo, nome FROM cargos WHERE nome = ?",
      [nome],
    );
    return rows[0];
  }

  /** Catálogo de permissões disponíveis (útil para montar o formulário de cargos). */
  async findAllPermissoes() {
    const [rows] = await pool.query(
      "SELECT id_permissao, nome, descricao FROM permissoes ORDER BY nome",
    );
    return rows;
  }

  /**
   * Cria o cargo e vincula as permissões (informadas pelo NOME) de forma atômica.
   */
  async create({ nome, permissoes = [] }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        "INSERT INTO cargos (nome) VALUES (?)",
        [nome],
      );
      await this._definirPermissoes(connection, result.insertId, permissoes);

      await connection.commit();
      return { id_cargo: result.insertId, nome, permissoes };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Atualiza o nome e/ou substitui a lista de permissões do cargo.
   * Retorna 0 se o cargo não existe, 1 se foi atualizado.
   */
  async update(id, { nome, permissoes }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [existe] = await connection.query(
        "SELECT id_cargo FROM cargos WHERE id_cargo = ? FOR UPDATE",
        [id],
      );
      if (existe.length === 0) {
        await connection.rollback();
        return 0;
      }

      if (nome !== undefined) {
        await connection.query(
          "UPDATE cargos SET nome = ? WHERE id_cargo = ?",
          [nome, id],
        );
      }
      if (permissoes !== undefined) {
        await this._definirPermissoes(connection, id, permissoes);
      }

      await connection.commit();
      return 1;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async delete(id) {
    const [result] = await pool.query("DELETE FROM cargos WHERE id_cargo = ?", [
      id,
    ]);
    return result.affectedRows;
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

  /**
   * Substitui as permissões do cargo pela lista de nomes informada.
   * Se algum nome não existir, lança 400 e a transação inteira é desfeita.
   */
  async _definirPermissoes(connection, id_cargo, nomes) {
    const unicos = [...new Set(nomes)];

    await connection.query("DELETE FROM cargo_permissoes WHERE id_cargo = ?", [
      id_cargo,
    ]);
    if (unicos.length === 0) return;

    const [encontradas] = await connection.query(
      "SELECT id_permissao, nome FROM permissoes WHERE nome IN (?)",
      [unicos],
    );
    if (encontradas.length !== unicos.length) {
      const achadas = encontradas.map((p) => p.nome);
      const faltando = unicos.filter((n) => !achadas.includes(n));
      throw {
        status: 400,
        mensagem: `Permissão inexistente: ${faltando.join(", ")}`,
      };
    }

    await connection.query(
      "INSERT INTO cargo_permissoes (id_cargo, id_permissao) VALUES ?",
      [encontradas.map((p) => [id_cargo, p.id_permissao])],
    );
  }
}

module.exports = new CargoRepository();
