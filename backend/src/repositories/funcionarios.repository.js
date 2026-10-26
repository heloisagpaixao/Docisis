const pool = require("../config/database");

class FuncionarioRepository {
  /**
   * Lista funcionários SEM expor o hash da senha.
   */
  async findAll({ page = 1, limit = 10 } = {}) {
    const [[{ total }]] = await pool.query(
      "SELECT COUNT(*) AS total FROM funcionarios",
    );

    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `SELECT f.id, f.nome, f.cpf, f.email, f.telefone, f.id_cargo, f.foto_perfil, f.criado_em,
              c.nome AS cargo
       FROM funcionarios f
       LEFT JOIN cargos c ON f.id_cargo = c.id_cargo
       ORDER BY f.id DESC
       LIMIT ? OFFSET ?`,
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

  /**
   * Busca funcionário por ID SEM expor o hash da senha.
   */
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT f.id, f.nome, f.cpf, f.email, f.telefone, f.id_cargo, f.foto_perfil, f.criado_em,
              c.nome AS cargo
       FROM funcionarios f
       LEFT JOIN cargos c ON f.id_cargo = c.id_cargo
       WHERE f.id = ?`,
      [id],
    );
    return rows[0];
  }

  async findByCpf(cpf) {
    const [rows] = await pool.query(
      "SELECT id, nome, cpf, email, telefone, id_cargo, foto_perfil, criado_em FROM funcionarios WHERE cpf = ?",
      [cpf],
    );
    return rows[0];
  }

  async findByEmail(email) {
    const [rows] = await pool.query(
      "SELECT id, nome, cpf, email, telefone, id_cargo, foto_perfil, criado_em FROM funcionarios WHERE email = ?",
      [email],
    );
    return rows[0];
  }

  /**
   * Usado pelo AuthService no login: precisa da senha (hash) e das
   * permissões do cargo para montar o payload do JWT.
   */
  async findByEmailWithCargo(email) {
    const [rows] = await pool.query(
      `SELECT f.id, f.nome, f.cpf, f.email, f.senha, f.telefone, f.id_cargo, f.foto_perfil, f.criado_em,
              c.nome AS cargo
       FROM funcionarios f
       LEFT JOIN cargos c ON f.id_cargo = c.id_cargo
       WHERE f.email = ?`,
      [email],
    );
    return rows[0];
  }

  async findByEmailAndCpf(email, cpf) {
    const [rows] = await pool.query(
      `SELECT f.id, f.nome, f.cpf, f.email, f.senha, f.telefone, f.id_cargo, f.foto_perfil, f.criado_em,
              c.nome AS cargo
       FROM funcionarios f
       JOIN cargos c ON f.id_cargo = c.id_cargo
       WHERE f.email = ? AND f.cpf = ?`,
      [email, cpf],
    );
    return rows[0];
  }

  /**
   * Busca funcionário por ID COM a senha (para alteração de senha).
   */
  async findByIdWithPassword(id) {
    const [rows] = await pool.query(
      "SELECT id, nome, cpf, email, senha, telefone, id_cargo, foto_perfil, criado_em FROM funcionarios WHERE id = ?",
      [id],
    );
    return rows[0];
  }

  /**
   * Lista as permissões (por NOME) do funcionário, via view vw_permissoes_funcionario.
   */
  async findPermissoes(id) {
    const [rows] = await pool.query(
      "SELECT permissao FROM vw_permissoes_funcionario WHERE id_funcionario = ? ORDER BY permissao",
      [id],
    );
    return rows.map((r) => r.permissao);
  }

  async create(funcionario) {
    const sql = `
        INSERT INTO funcionarios (nome, cpf, email, senha, telefone, id_cargo, foto_perfil)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      funcionario.nome,
      funcionario.cpf,
      funcionario.email,
      funcionario.senha,
      funcionario.telefone,
      funcionario.id_cargo,
      funcionario.foto_perfil,
    ];

    const [result] = await pool.query(sql, params);
    return result.insertId;
  }

  /**
   * Update com whitelist de campos permitidos.
   */
  async update(id, funcionarioData) {
    const allowedFields = [
      "nome",
      "cpf",
      "email",
      "senha",
      "telefone",
      "id_cargo",
      "foto_perfil",
    ];
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(funcionarioData)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
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

  /**
   * Verifica se existem registros dependentes vinculados ao funcionário.
   */
  async hasDependents(id) {
    const [rows] = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM entradas WHERE id_funcionario = ?) +
        (SELECT COUNT(*) FROM saidas WHERE id_funcionario = ?) +
        (SELECT COUNT(*) FROM ajustes WHERE id_funcionario = ?) AS total`,
      [id, id, id],
    );
    return rows[0].total > 0;
  }
}

module.exports = new FuncionarioRepository();
