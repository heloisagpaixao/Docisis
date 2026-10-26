const pool = require("../config/database");

const LEITURA = `
  LEFT JOIN notificacao_leituras r
         ON r.id_notificacao = n.id_notificacao AND r.id_funcionario = ?`;

const COLUNAS = `n.id_notificacao, n.tipo, n.severidade, n.mensagem, n.id_lote, n.id_produto,
                 n.criada_em, n.resolvida_em, (r.id_funcionario IS NOT NULL) AS lida`;

// o MySQL devolve 0/1; aqui vira true/false
const formatar = (row) => row && { ...row, lida: Boolean(row.lida) };

class NotificacaoRepository {
  /**
   * Lista as notificações do ponto de vista de UM funcionário (campo `lida`).
   * Por padrão só as ativas; com historico=true inclui as já resolvidas.
   */
  async findAll({
    page = 1,
    limit = 10,
    id_funcionario,
    lida,
    tipo,
    severidade,
    historico = false,
  } = {}) {
    const filtros = [];
    const params = [];

    if (!historico) filtros.push("n.resolvida_em IS NULL");
    if (tipo) {
      filtros.push("n.tipo = ?");
      params.push(tipo);
    }
    if (severidade) {
      filtros.push("n.severidade = ?");
      params.push(severidade);
    }
    if (lida === true) filtros.push("r.id_funcionario IS NOT NULL");
    if (lida === false) filtros.push("r.id_funcionario IS NULL");
    const where = filtros.length ? `WHERE ${filtros.join(" AND ")}` : "";

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM notificacoes n ${LEITURA} ${where}`,
      [id_funcionario, ...params],
    );

    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `SELECT ${COLUNAS}
       FROM notificacoes n ${LEITURA}
       ${where}
       ORDER BY FIELD(n.severidade, 'CRITICA', 'ATENCAO', 'INFO'), n.criada_em DESC, n.id_notificacao DESC
       LIMIT ? OFFSET ?`,
      [id_funcionario, ...params, limit, offset],
    );

    return {
      dados: rows.map(formatar),
      total,
      pagina: page,
      limite: limit,
      totalPaginas: Math.ceil(total / limit),
    };
  }

  async findById(id, id_funcionario) {
    const [rows] = await pool.query(
      `SELECT ${COLUNAS} FROM notificacoes n ${LEITURA} WHERE n.id_notificacao = ?`,
      [id_funcionario, id],
    );
    return formatar(rows[0]);
  }

  /** Contagem para o "sininho": alertas ativos que ESTE funcionário ainda não leu. */
  async resumo(id_funcionario) {
    const [rows] = await pool.query(
      `SELECT n.severidade, COUNT(*) AS total
       FROM notificacoes n ${LEITURA}
       WHERE n.resolvida_em IS NULL AND r.id_funcionario IS NULL
       GROUP BY n.severidade`,
      [id_funcionario],
    );
    const [[{ ativas }]] = await pool.query(
      "SELECT COUNT(*) AS ativas FROM notificacoes WHERE resolvida_em IS NULL",
    );

    const nao_lidas = { CRITICA: 0, ATENCAO: 0, INFO: 0, total: 0 };
    for (const r of rows) {
      nao_lidas[r.severidade] = r.total;
      nao_lidas.total += r.total;
    }
    return { ativas, nao_lidas };
  }

  /** Idempotente: marcar duas vezes não gera erro nem duplicata. */
  async marcarLida(id_notificacao, id_funcionario) {
    await pool.query(
      `INSERT INTO notificacao_leituras (id_notificacao, id_funcionario) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE id_notificacao = id_notificacao`,
      [id_notificacao, id_funcionario],
    );
  }

  /** Marca como lidas todas as ativas que o funcionário ainda não leu. Devolve quantas. */
  async marcarTodasLidas(id_funcionario) {
    const [result] = await pool.query(
      `INSERT INTO notificacao_leituras (id_notificacao, id_funcionario)
       SELECT n.id_notificacao, ?
       FROM notificacoes n
       WHERE n.resolvida_em IS NULL
         AND NOT EXISTS (SELECT 1 FROM notificacao_leituras r
                         WHERE r.id_notificacao = n.id_notificacao AND r.id_funcionario = ?)`,
      [id_funcionario, id_funcionario],
    );
    return result.affectedRows;
  }

  // ----- usados pela rotina de verificação -----

  async findAtivas() {
    const [rows] = await pool.query(
      "SELECT id_notificacao, chave_ativa FROM notificacoes WHERE resolvida_em IS NULL",
    );
    return rows;
  }

  /** Devolve false (sem erro) se a situação já tem alerta ativo. */
  async inserir({
    tipo,
    severidade,
    mensagem,
    id_lote = null,
    id_produto = null,
    chave,
  }) {
    try {
      await pool.query(
        `INSERT INTO notificacoes (tipo, severidade, mensagem, id_lote, id_produto, chave_ativa)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [tipo, severidade, mensagem, id_lote, id_produto, chave],
      );
      return true;
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") return false;
      throw error;
    }
  }

  async atualizarMensagem(chave, mensagem) {
    await pool.query(
      "UPDATE notificacoes SET mensagem = ? WHERE chave_ativa = ? AND mensagem <> ?",
      [mensagem, chave, mensagem],
    );
  }

  /** Encerra os alertas: viram histórico e liberam a chave para uma futura ocorrência. */
  async resolver(ids) {
    if (ids.length === 0) return 0;
    const [result] = await pool.query(
      "UPDATE notificacoes SET resolvida_em = NOW(), chave_ativa = NULL WHERE id_notificacao IN (?)",
      [ids],
    );
    return result.affectedRows;
  }

  /**
   * Lotes COM SALDO vencidos ou que vencem em até `dias` dias.
   * As contas de data são feitas no banco para não depender de fuso horário.
   */
  async findLotesComValidade(dias) {
    const [rows] = await pool.query(
      `SELECT l.id, l.quantidade, l.id_produto, p.nome AS produto_nome,
              DATEDIFF(l.dt_validade, CURDATE()) AS dias,
              DATE_FORMAT(l.dt_validade, '%d/%m/%Y') AS validade
       FROM lotes l
       JOIN produtos p ON p.id_produto = l.id_produto
       WHERE l.quantidade > 0
         AND l.dt_validade <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
       ORDER BY l.dt_validade ASC`,
      [Number(dias)],
    );
    return rows;
  }

  /**
   * Saldo UTILIZÁVEL por produto (lotes vencidos não contam) dos produtos que
   * têm estoque mínimo e/ou máximo definido.
   */
  async findSaldosPorProduto() {
    const [rows] = await pool.query(
      `SELECT p.id_produto, p.nome, p.estoque_minimo, p.estoque_maximo,
              COALESCE(SUM(CASE WHEN l.dt_validade >= CURDATE() THEN l.quantidade ELSE 0 END), 0) AS saldo
       FROM produtos p
       LEFT JOIN lotes l ON l.id_produto = p.id_produto
       WHERE p.estoque_minimo IS NOT NULL OR p.estoque_maximo IS NOT NULL
       GROUP BY p.id_produto, p.nome, p.estoque_minimo, p.estoque_maximo`,
    );
    return rows.map((r) => ({ ...r, saldo: Number(r.saldo) }));
  }
}

module.exports = new NotificacaoRepository();
