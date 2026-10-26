const db = require("../config/database");

class AjusteRepository {
  async create({ id_lote, id_funcionario, quantidade_nova, motivo }) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Busca e trava a linha do lote para garantir consistência concorrente
      const [lotes] = await connection.execute(
        "SELECT quantidade FROM lotes WHERE id = ? FOR UPDATE",
        [id_lote],
      );

      if (lotes.length === 0) {
        throw { status: 404, mensagem: "Lote não encontrado." };
      }

      const quantidade_anterior = lotes[0].quantidade;
      const quantidade_ajuste = quantidade_nova - quantidade_anterior;

      // Atualiza o saldo do lote
      await connection.execute("UPDATE lotes SET quantidade = ? WHERE id = ?", [
        quantidade_nova,
        id_lote,
      ]);

      // Insere o histórico do ajuste
      const [result] = await connection.execute(
        `INSERT INTO ajustes 
          (id_funcionario, id_lote, quantidade_anterior, quantidade_nova, quantidade_ajuste, motivo) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id_funcionario,
          id_lote,
          quantidade_anterior,
          quantidade_nova,
          quantidade_ajuste,
          motivo,
        ],
      );

      await connection.commit();

      return {
        id_ajuste: result.insertId,
        id_funcionario,
        id_lote,
        quantidade_anterior,
        quantidade_nova,
        quantidade_ajuste,
        motivo,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async findById(id) {
    const [rows] = await db.execute(
      `
      SELECT 
        a.id_ajuste,
        a.dt_ajuste,
        a.quantidade_anterior,
        a.quantidade_nova,
        a.quantidade_ajuste,
        a.motivo,
        f.id AS id_funcionario,
        f.nome AS funcionario_nome,
        l.id AS id_lote,
        p.nome AS produto_nome
      FROM ajustes a
      INNER JOIN funcionarios f ON f.id = a.id_funcionario
      INNER JOIN lotes l ON l.id = a.id_lote
      LEFT JOIN produtos p ON l.id_produto = p.id_produto
      WHERE a.id_ajuste = ?
    `,
      [id],
    );

    return rows[0] || null;
  }

  async findAll({
    id_lote,
    id_funcionario,
    data_inicio,
    data_fim,
    page = 1,
    limit = 10,
  } = {}) {
    let countSql = `SELECT COUNT(*) AS total FROM ajustes a WHERE 1=1`;
    let sql = `
      SELECT 
        a.id_ajuste,
        a.dt_ajuste,
        a.quantidade_anterior,
        a.quantidade_nova,
        a.quantidade_ajuste,
        a.motivo,
        f.nome AS funcionario,
        l.id AS id_lote,
        p.nome AS produto_nome
      FROM ajustes a
      INNER JOIN funcionarios f ON f.id = a.id_funcionario
      INNER JOIN lotes l ON l.id = a.id_lote
      LEFT JOIN produtos p ON l.id_produto = p.id_produto
      WHERE 1=1
    `;
    const params = [];
    const countParams = [];

    if (id_lote) {
      sql += " AND a.id_lote = ?";
      countSql += " AND a.id_lote = ?";
      params.push(id_lote);
      countParams.push(id_lote);
    }

    if (id_funcionario) {
      sql += " AND a.id_funcionario = ?";
      countSql += " AND a.id_funcionario = ?";
      params.push(id_funcionario);
      countParams.push(id_funcionario);
    }

    if (data_inicio && data_fim) {
      sql += " AND a.dt_ajuste BETWEEN ? AND ?";
      countSql += " AND a.dt_ajuste BETWEEN ? AND ?";
      params.push(data_inicio, data_fim);
      countParams.push(data_inicio, data_fim);
    }

    const [[{ total }]] = await db.execute(countSql, countParams);

    const offset = (page - 1) * limit;
    sql += " ORDER BY a.dt_ajuste DESC LIMIT ? OFFSET ?";
    params.push(String(limit), String(offset));

    const [rows] = await db.execute(sql, params);

    return {
      dados: rows,
      total,
      pagina: page,
      limite: limit,
      totalPaginas: Math.ceil(total / limit),
    };
  }
}

module.exports = new AjusteRepository();
