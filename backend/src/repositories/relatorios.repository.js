const pool = require("../config/database");
const { escaparLike } = require("../utils/busca");

// Datas voltam como TEXTO ('AAAA-MM-DD' ou 'AAAA-MM-DD HH:MM:SS') já formatado pelo banco:
// assim a planilha mostra exatamente o que está gravado, sem depender de fuso horário.
const DATA = (coluna) => `DATE_FORMAT(${coluna}, '%Y-%m-%d')`;
const DATA_HORA = (coluna) => `DATE_FORMAT(${coluna}, '%Y-%m-%d %H:%i:%s')`;

/**
 * Consultas dedicadas a relatórios: sem paginação (a planilha leva tudo) e com um
 * LIMITE de segurança, para um relatório gigante não travar o servidor.
 */
class RelatorioRepository {
  /** Um lote por linha, só com saldo. */
  async estoquePorLote({ id_produto, limite }) {
    const filtros = ["l.quantidade > 0"];
    const params = [];
    if (id_produto) {
      filtros.push("l.id_produto = ?");
      params.push(id_produto);
    }

    const [rows] = await pool.query(
      `SELECT l.id AS id_lote, p.nome AS produto, p.codigo, l.quantidade AS saldo,
              ${DATA("l.dt_validade")} AS validade,
              DATEDIFF(l.dt_validade, CURDATE()) AS dias_para_vencer,
              nf.id_nota, nf.fornecedor, ${DATA_HORA("nf.dt_compra")} AS dt_compra
       FROM lotes l
       JOIN produtos p ON p.id_produto = l.id_produto
       JOIN nota_fiscal nf ON nf.id_nota = l.id_nota
       WHERE ${filtros.join(" AND ")}
       ORDER BY p.nome ASC, l.dt_validade ASC, l.id ASC
       LIMIT ?`,
      [...params, limite],
    );
    return rows;
  }

  /** Um produto por linha: saldo utilizável (não vencido) x saldo vencido. */
  async resumoPorProduto({ id_produto, limite }) {
    const params = [];
    let where = "";
    if (id_produto) {
      where = "WHERE p.id_produto = ?";
      params.push(id_produto);
    }

    const [rows] = await pool.query(
      `SELECT p.id_produto, p.nome AS produto, p.codigo, p.estoque_minimo, p.estoque_maximo,
              COALESCE(SUM(CASE WHEN l.dt_validade >= CURDATE() THEN l.quantidade ELSE 0 END), 0) AS saldo_utilizavel,
              COALESCE(SUM(CASE WHEN l.dt_validade <  CURDATE() THEN l.quantidade ELSE 0 END), 0) AS saldo_vencido,
              COUNT(CASE WHEN l.quantidade > 0 THEN 1 END) AS lotes_com_saldo
       FROM produtos p
       LEFT JOIN lotes l ON l.id_produto = p.id_produto
       ${where}
       GROUP BY p.id_produto, p.nome, p.codigo, p.estoque_minimo, p.estoque_maximo
       ORDER BY p.nome ASC
       LIMIT ?`,
      [...params, limite],
    );
    return rows.map((r) => ({
      ...r,
      saldo_utilizavel: Number(r.saldo_utilizavel),
      saldo_vencido: Number(r.saldo_vencido),
    }));
  }

  /**
   * Entradas, saídas e ajustes juntos, do mais recente para o mais antigo.
   * `variacao` é o efeito no estoque: entrada +, saída -, ajuste = diferença.
   */
  async movimentacoes({
    data_inicio,
    data_fim,
    id_funcionario,
    id_lote,
    id_produto,
    tipo,
    busca,
    limite,
  }) {
    const filtros = [];
    const params = [];
    if (data_inicio && data_fim) {
      filtros.push("m.dt BETWEEN ? AND ?");
      params.push(data_inicio, data_fim);
    }
    if (id_funcionario) {
      filtros.push("m.id_funcionario = ?");
      params.push(id_funcionario);
    }
    if (id_lote) {
      filtros.push("m.id_lote = ?");
      params.push(id_lote);
    }
    if (id_produto) {
      filtros.push("l.id_produto = ?");
      params.push(id_produto);
    }
    if (tipo) {
      filtros.push("m.tipo = ?");
      params.push(tipo);
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

    const [rows] = await pool.query(
      `SELECT m.tipo, m.id, ${DATA_HORA("m.dt")} AS data_hora, m.id_lote,
              p.nome AS produto, p.codigo, m.quantidade, m.qtd_anterior, m.qtd_nova, m.variacao,
              m.motivo, f.nome AS funcionario
       FROM (
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
         FROM ajustes a
       ) m
       JOIN lotes l ON l.id = m.id_lote
       JOIN produtos p ON p.id_produto = l.id_produto
       JOIN funcionarios f ON f.id = m.id_funcionario
       ${where}
       ORDER BY m.dt DESC, m.tipo ASC, m.id DESC
       LIMIT ?`,
      [...params, limite],
    );
    return rows;
  }

  /** Lotes COM SALDO vencidos ou que vencem em até `dias` dias, do mais urgente ao menos. */
  async vencimentos({ dias, limite }) {
    const [rows] = await pool.query(
      `SELECT l.id AS id_lote, p.nome AS produto, p.codigo, l.quantidade AS saldo,
              ${DATA("l.dt_validade")} AS validade,
              DATEDIFF(l.dt_validade, CURDATE()) AS dias_restantes,
              nf.id_nota, nf.fornecedor
       FROM lotes l
       JOIN produtos p ON p.id_produto = l.id_produto
       JOIN nota_fiscal nf ON nf.id_nota = l.id_nota
       WHERE l.quantidade > 0 AND l.dt_validade <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
       ORDER BY l.dt_validade ASC, p.nome ASC, l.id ASC
       LIMIT ?`,
      [dias, limite],
    );
    return rows;
  }

  async notasFiscais({ data_inicio, data_fim, fornecedor, limite }) {
    const filtros = [];
    const params = [];
    if (data_inicio && data_fim) {
      filtros.push("nf.dt_compra BETWEEN ? AND ?");
      params.push(data_inicio, data_fim);
    }
    if (fornecedor) {
      filtros.push("nf.fornecedor LIKE ?");
      params.push(`%${fornecedor}%`);
    }
    const where = filtros.length ? `WHERE ${filtros.join(" AND ")}` : "";

    const [rows] = await pool.query(
      `SELECT nf.id_nota, ${DATA_HORA("nf.dt_compra")} AS dt_compra, nf.fornecedor, nf.quantidade,
              (nf.arquivo IS NOT NULL) AS tem_arquivo, COUNT(l.id) AS lotes
       FROM nota_fiscal nf
       LEFT JOIN lotes l ON l.id_nota = nf.id_nota
       ${where}
       GROUP BY nf.id_nota, nf.dt_compra, nf.fornecedor, nf.quantidade, nf.arquivo
       ORDER BY nf.dt_compra DESC, nf.id_nota DESC
       LIMIT ?`,
      [...params, limite],
    );
    return rows;
  }
}

module.exports = new RelatorioRepository();
