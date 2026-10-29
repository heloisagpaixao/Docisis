const pool = require("../config/database");
const { escaparLike } = require("../utils/busca");

// Entradas, saídas e ajustes numa tabela só. `variacao` é o efeito no estoque:
// entrada +, saída -, ajuste = a diferença.
const UNIAO = `
  SELECT 'ENTRADA' AS tipo, e.id_entrada AS id, e.dt_entrada AS dt, e.id_lote, e.id_funcionario,
         e.quantidade, NULL AS qtd_anterior, NULL AS qtd_nova, e.quantidade AS variacao, e.motivo
  FROM entradas e
  UNION ALL
  SELECT 'SAIDA', s.id_saida, s.dt_saida, s.id_lote, s.id_funcionario,
         s.quantidade, NULL, NULL, -s.quantidade, s.motivo
  FROM saidas s
  UNION ALL
  SELECT 'AJUSTE', a.id_ajuste, a.dt_ajuste, a.id_lote, a.id_funcionario,
         a.quantidade_ajuste, a.quantidade_anterior, a.quantidade_nova, a.quantidade_ajuste, a.motivo
  FROM ajustes a`;

const JUNCOES = `
  FROM (${UNIAO}) m
  JOIN lotes l ON l.id = m.id_lote
  JOIN produtos p ON p.id_produto = l.id_produto
  JOIN funcionarios f ON f.id = m.id_funcionario`;

class MovimentacaoRepository {
  /**
   * Histórico paginado, do mais recente para o mais antigo.
   * `tipos` limita quais movimentações entram (ex.: sem AJUSTE para quem não pode vê-los).
   */
  async findAll({
    page = 1,
    limit = 10,
    tipos,
    data_inicio,
    data_fim,
    id_produto,
    id_lote,
    id_funcionario,
    busca,
  } = {}) {
    const filtros = [];
    const params = [];

    if (tipos && tipos.length) {
      filtros.push("m.tipo IN (?)");
      params.push(tipos);
    }
    if (data_inicio && data_fim) {
      filtros.push("m.dt BETWEEN ? AND ?");
      params.push(data_inicio, data_fim);
    }
    if (id_produto) {
      filtros.push("l.id_produto = ?");
      params.push(id_produto);
    }
    if (id_lote) {
      filtros.push("m.id_lote = ?");
      params.push(id_lote);
    }
    if (id_funcionario) {
      filtros.push("m.id_funcionario = ?");
      params.push(id_funcionario);
    }
    if (busca) {
      const like = `%${escaparLike(busca)}%`;
      filtros.push(
        `(p.nome LIKE ? ESCAPE '!' OR CAST(p.codigo AS CHAR) LIKE ? ESCAPE '!'
          OR m.motivo LIKE ? ESCAPE '!' OR f.nome LIKE ? ESCAPE '!')`,
      );
      params.push(like, like, like, like);
    }
    const where = filtros.length ? `WHERE ${filtros.join(" AND ")}` : "";

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total ${JUNCOES} ${where}`,
      params,
    );

    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `SELECT m.tipo, m.id, DATE_FORMAT(m.dt, '%Y-%m-%d %H:%i:%s') AS data_hora, m.id_lote,
              l.id_produto, p.nome AS produto_nome, p.codigo,
              m.quantidade, m.qtd_anterior, m.qtd_nova, m.variacao, m.motivo,
              m.id_funcionario, f.nome AS funcionario_nome
       ${JUNCOES}
       ${where}
       ORDER BY m.dt DESC, m.tipo ASC, m.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    return {
      dados: rows,
      total,
      pagina: page,
      limite: limit,
      totalPaginas: Math.ceil(total / limit),
    };
  }
}

module.exports = new MovimentacaoRepository();
