const pool = require("../config/database");
const { escaparLike } = require("../utils/busca");
const { situacaoDaValidade } = require("../utils/alertas");

class EstoqueRepository {
  async findAll({ page = 1, limit = 10 } = {}) {
    const [[{ total }]] = await pool.query(
      "SELECT COUNT(*) AS total FROM lotes WHERE quantidade > 0",
    );

    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `SELECT 
          l.id AS id_lote,
          l.quantidade,
          l.id_produto,
          p.nome AS produto_nome,
          l.dt_validade,
          l.alterado_em,
          l.id_nota
       FROM lotes l
       LEFT JOIN produtos p ON l.id_produto = p.id_produto
       WHERE l.quantidade > 0
       ORDER BY l.id DESC
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

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT 
          l.id AS id_lote,
          l.quantidade,
          l.id_produto,
          p.nome AS produto_nome,
          l.dt_validade,
          l.alterado_em,
          l.id_nota
       FROM lotes l
       LEFT JOIN produtos p ON l.id_produto = p.id_produto
       WHERE l.id = ? AND l.quantidade > 0`,
      [id],
    );
    return rows[0];
  }

  async findByLoteId(id_lote) {
    return this.findById(id_lote);
  }

  async findBaixo(limite = 10) {
    const [rows] = await pool.query(
      `SELECT 
          l.id AS id_lote,
          l.quantidade,
          l.id_produto,
          p.nome AS produto_nome,
          l.dt_validade
       FROM lotes l
       LEFT JOIN produtos p ON l.id_produto = p.id_produto
       WHERE l.quantidade > 0 AND l.quantidade <= ?
       ORDER BY l.quantidade ASC`,
      [Number(limite)],
    );
    return rows;
  }

  /**
   * Lista de lotes COM SALDO para a tela de estoque: com produto, código, peso, fornecedor,
   * dias para vencer e situação da validade, mais busca e filtros.
   *  - busca:    nome do produto, código, fornecedor ou número do lote
   *  - situacao: "vencido" | "a_vencer" (vence em até `diasAlerta` dias) | "ok"
   *  - ordem:    "validade" (padrão: o que vence primeiro vem primeiro) | "produto" | "saldo"
   */
  async findAllDetalhado({
    page = 1,
    limit = 10,
    busca,
    situacao,
    id_produto,
    ordem = "validade",
    diasAlerta = 7,
  } = {}) {
    const filtros = ["l.quantidade > 0"];
    const params = [];

    if (id_produto) {
      filtros.push("l.id_produto = ?");
      params.push(id_produto);
    }
    if (busca) {
      const like = `%${escaparLike(busca)}%`;
      filtros.push(
        `(p.nome LIKE ? ESCAPE '!' OR CAST(p.codigo AS CHAR) LIKE ? ESCAPE '!'
          OR nf.fornecedor LIKE ? ESCAPE '!' OR CAST(l.id AS CHAR) LIKE ? ESCAPE '!')`,
      );
      params.push(like, like, like, like);
    }
    if (situacao === "vencido") filtros.push("l.dt_validade < CURDATE()");
    if (situacao === "a_vencer") {
      filtros.push(
        "l.dt_validade >= CURDATE() AND l.dt_validade <= DATE_ADD(CURDATE(), INTERVAL ? DAY)",
      );
      params.push(diasAlerta);
    }
    if (situacao === "ok") {
      filtros.push("l.dt_validade > DATE_ADD(CURDATE(), INTERVAL ? DAY)");
      params.push(diasAlerta);
    }

    const ORDENS = {
      validade: "l.dt_validade ASC, p.nome ASC, l.id ASC",
      produto: "p.nome ASC, l.dt_validade ASC, l.id ASC",
      saldo: "l.quantidade DESC, l.dt_validade ASC, l.id ASC",
    };
    const orderBy = ORDENS[ordem] || ORDENS.validade;
    const from = `FROM lotes l
                  JOIN produtos p ON p.id_produto = l.id_produto
                  JOIN nota_fiscal nf ON nf.id_nota = l.id_nota
                  WHERE ${filtros.join(" AND ")}`;

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total ${from}`,
      params,
    );

    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `SELECT l.id AS id_lote, l.quantidade, l.id_produto, p.nome AS produto_nome, p.codigo, p.peso,
              (p.imagem IS NOT NULL) AS tem_imagem,
              DATE_FORMAT(l.dt_validade, '%Y-%m-%d') AS dt_validade,
              DATEDIFF(l.dt_validade, CURDATE()) AS dias_para_vencer,
              DATE_FORMAT(l.alterado_em, '%Y-%m-%d %H:%i:%s') AS alterado_em,
              l.id_nota, nf.fornecedor
       ${from}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    return {
      dados: rows.map((r) => ({
        ...r,
        peso: r.peso === null ? null : Number(r.peso),
        tem_imagem: Boolean(r.tem_imagem),
        situacao: situacaoDaValidade(r.dias_para_vencer, diasAlerta),
      })),
      total,
      pagina: page,
      limite: limit,
      totalPaginas: Math.ceil(total / limit),
    };
  }

  /** Números dos cartões do topo da tela de estoque. */
  async resumo(diasAlerta = 7) {
    const [[lotes]] = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN dt_validade >= CURDATE() THEN quantidade ELSE 0 END), 0) AS unidades_utilizaveis,
         COALESCE(SUM(CASE WHEN dt_validade <  CURDATE() THEN quantidade ELSE 0 END), 0) AS unidades_vencidas,
         COUNT(*) AS lotes_com_saldo,
         COALESCE(SUM(dt_validade < CURDATE()), 0) AS lotes_vencidos,
         COALESCE(SUM(dt_validade >= CURDATE() AND dt_validade <= DATE_ADD(CURDATE(), INTERVAL ? DAY)), 0) AS lotes_a_vencer
       FROM lotes
       WHERE quantidade > 0`,
      [diasAlerta],
    );

    // produtos com estoque mínimo definido cujo saldo UTILIZÁVEL (sem vencidos) chegou nele ou abaixo
    const [[criticos]] = await pool.query(
      `SELECT COUNT(*) AS produtos_criticos FROM (
         SELECT p.id_produto
         FROM produtos p
         LEFT JOIN lotes l ON l.id_produto = p.id_produto
         WHERE p.estoque_minimo IS NOT NULL
         GROUP BY p.id_produto, p.estoque_minimo
         HAVING COALESCE(SUM(CASE WHEN l.dt_validade >= CURDATE() THEN l.quantidade ELSE 0 END), 0) <= p.estoque_minimo
       ) x`,
    );
    const [[produtos]] = await pool.query(
      "SELECT COUNT(*) AS produtos_total FROM produtos",
    );

    return {
      unidades_utilizaveis: Number(lotes.unidades_utilizaveis),
      unidades_vencidas: Number(lotes.unidades_vencidas),
      lotes_com_saldo: Number(lotes.lotes_com_saldo),
      lotes_vencidos: Number(lotes.lotes_vencidos),
      lotes_a_vencer: Number(lotes.lotes_a_vencer),
      produtos_criticos: Number(criticos.produtos_criticos),
      produtos_total: Number(produtos.produtos_total),
      dias_alerta: diasAlerta,
    };
  }
}

module.exports = new EstoqueRepository();
