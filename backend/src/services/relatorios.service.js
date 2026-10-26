const relatorioRepository = require("../repositories/relatorios.repository");
const funcionarioRepository = require("../repositories/funcionarios.repository");
const {
  FORMATOS,
  dataExcel,
  novoLivro,
  adicionarTabela,
  adicionarInformacoes,
  hojeTexto,
  paraBuffer,
} = require("../utils/planilha");

const erro = (status, mensagem) => ({ status, mensagem });

// Limite de linhas por relatório (RELATORIOS_MAX_LINHAS no .env; padrão 50.000)
const maxLinhas = () => Number(process.env.RELATORIOS_MAX_LINHAS) || 50000;
// Pede UMA linha a mais só para saber se estourou o limite
const limiteConsulta = () => maxLinhas() + 1;

function conferirLimite(...listas) {
  if (listas.some((l) => l.length > maxLinhas())) {
    throw erro(
      422,
      `O relatório passa de ${maxLinhas()} linhas. Use filtros (por exemplo, o período) para reduzi-lo.`,
    );
  }
}

const diasAlerta = () => Number(process.env.NOTIFICACOES_DIAS_VALIDADE) || 7;
const soma = (lista, campo) =>
  lista.reduce((total, item) => total + Number(item[campo] || 0), 0);
const texto = (valor) =>
  valor === undefined || valor === null ? "(todos)" : String(valor);

async function nomeDoUsuario(id) {
  const funcionario = await funcionarioRepository.findById(id);
  return funcionario ? funcionario.nome : "—";
}

async function finalizar(livro, nomeBase) {
  return {
    nomeArquivo: `docisis-${nomeBase}-${hojeTexto()}.xlsx`,
    buffer: await paraBuffer(livro),
  };
}

// ---------------------------------------------------------------- ESTOQUE

function situacaoLote(dias) {
  if (dias < 0) return "VENCIDO";
  if (dias === 0) return "VENCE HOJE";
  if (dias <= diasAlerta()) return "VENCE EM BREVE";
  return "OK";
}

// Mesma regra das notificações: estoque vencido não conta como disponível
function situacaoProduto({
  saldo_utilizavel: saldo,
  estoque_minimo: min,
  estoque_maximo: max,
}) {
  if (min !== null && saldo === 0) return "SEM ESTOQUE";
  if (min !== null && saldo <= min) return "ESTOQUE BAIXO";
  if (max !== null && saldo > max) return "ACIMA DO MÁXIMO";
  return "OK";
}

async function estoque({ id_produto }, idUsuario) {
  const [lotes, produtos] = await Promise.all([
    relatorioRepository.estoquePorLote({
      id_produto,
      limite: limiteConsulta(),
    }),
    relatorioRepository.resumoPorProduto({
      id_produto,
      limite: limiteConsulta(),
    }),
  ]);
  conferirLimite(lotes, produtos);

  const livro = novoLivro();
  adicionarTabela(
    livro,
    "Estoque por lote",
    [
      {
        titulo: "Lote",
        chave: "lote",
        centralizar: true,
        largura: 8,
        formato: FORMATOS.inteiro,
      },
      { titulo: "Produto", chave: "produto", largura: 30 },
      { titulo: "Código", chave: "codigo", centralizar: true, largura: 10 },
      {
        titulo: "Saldo",
        chave: "saldo",
        largura: 10,
        formato: FORMATOS.inteiro,
      },
      {
        titulo: "Validade",
        chave: "validade",
        largura: 12,
        formato: FORMATOS.data,
      },
      {
        titulo: "Dias para vencer",
        chave: "dias",
        centralizar: true,
        largura: 12,
        formato: FORMATOS.inteiroSinal,
      },
      { titulo: "Situação", chave: "situacao", centralizar: true, largura: 16 },
      { titulo: "Fornecedor", chave: "fornecedor", largura: 24 },
      { titulo: "Nota", chave: "nota", centralizar: true, largura: 8 },
      {
        titulo: "Data da compra",
        chave: "compra",
        largura: 16,
        formato: FORMATOS.dataHora,
      },
    ],
    lotes.map((l) => ({
      lote: l.id_lote,
      produto: l.produto,
      codigo: l.codigo,
      saldo: l.saldo,
      validade: dataExcel(l.validade),
      dias: l.dias_para_vencer,
      situacao: situacaoLote(l.dias_para_vencer),
      fornecedor: l.fornecedor,
      nota: l.id_nota,
      compra: dataExcel(l.dt_compra),
    })),
    { colunaSituacao: "situacao" },
  );

  adicionarTabela(
    livro,
    "Resumo por produto",
    [
      { titulo: "Produto", chave: "produto", largura: 30 },
      { titulo: "Código", chave: "codigo", centralizar: true, largura: 10 },
      {
        titulo: "Saldo utilizável",
        chave: "utilizavel",
        largura: 14,
        formato: FORMATOS.inteiro,
      },
      {
        titulo: "Saldo vencido",
        chave: "vencido",
        largura: 14,
        formato: FORMATOS.inteiro,
      },
      {
        titulo: "Lotes com saldo",
        chave: "lotes",
        centralizar: true,
        largura: 12,
        formato: FORMATOS.inteiro,
      },
      {
        titulo: "Estoque mínimo",
        chave: "minimo",
        largura: 12,
        formato: FORMATOS.inteiro,
      },
      {
        titulo: "Estoque máximo",
        chave: "maximo",
        largura: 12,
        formato: FORMATOS.inteiro,
      },
      { titulo: "Situação", chave: "situacao", centralizar: true, largura: 16 },
    ],
    produtos.map((p) => ({
      produto: p.produto,
      codigo: p.codigo,
      utilizavel: p.saldo_utilizavel,
      vencido: p.saldo_vencido,
      lotes: p.lotes_com_saldo,
      minimo: p.estoque_minimo,
      maximo: p.estoque_maximo,
      situacao: situacaoProduto(p),
    })),
    { colunaSituacao: "situacao" },
  );

  adicionarInformacoes(livro, {
    titulo: "Estoque atual",
    geradoPor: await nomeDoUsuario(idUsuario),
    filtros: [["Produto (id)", texto(id_produto)]],
    totais: [
      ["Lotes com saldo", lotes.length],
      ["Saldo total em lotes (unidades)", soma(lotes, "saldo")],
      ["Produtos listados", produtos.length],
    ],
  });
  return finalizar(livro, "estoque");
}

// ---------------------------------------------------------- MOVIMENTAÇÕES

const ROTULO_TIPO = { ENTRADA: "ENTRADA", SAIDA: "SAÍDA", AJUSTE: "AJUSTE" };

async function movimentacoes(filtros, idUsuario) {
  const linhas = await relatorioRepository.movimentacoes({
    ...filtros,
    limite: limiteConsulta(),
  });
  conferirLimite(linhas);

  // resumo por produto, calculado a partir das mesmas linhas da aba principal
  const porProduto = new Map();
  for (const l of linhas) {
    const chave = `${l.produto}\u0000${l.codigo}`;
    const r = porProduto.get(chave) || {
      produto: l.produto,
      codigo: l.codigo,
      entradas: 0,
      saidas: 0,
      ajustes: 0,
    };
    if (l.tipo === "ENTRADA") r.entradas += Number(l.quantidade);
    if (l.tipo === "SAIDA") r.saidas += Number(l.quantidade);
    if (l.tipo === "AJUSTE") r.ajustes += Number(l.variacao);
    porProduto.set(chave, r);
  }
  const resumo = [...porProduto.values()]
    .sort((a, b) => a.produto.localeCompare(b.produto, "pt-BR"))
    .map((r) => ({ ...r, variacao: r.entradas - r.saidas + r.ajustes }));

  const livro = novoLivro();
  adicionarTabela(
    livro,
    "Movimentações",
    [
      {
        titulo: "Data e hora",
        chave: "data",
        largura: 17,
        formato: FORMATOS.dataHora,
      },
      { titulo: "Tipo", chave: "tipo", centralizar: true, largura: 10 },
      {
        titulo: "Lote",
        chave: "lote",
        centralizar: true,
        largura: 8,
        formato: FORMATOS.inteiro,
      },
      { titulo: "Produto", chave: "produto", largura: 30 },
      { titulo: "Código", chave: "codigo", centralizar: true, largura: 10 },
      {
        titulo: "Quantidade",
        chave: "quantidade",
        largura: 12,
        formato: FORMATOS.inteiro,
      },
      {
        titulo: "Qtd. anterior",
        chave: "anterior",
        largura: 12,
        formato: FORMATOS.inteiro,
      },
      {
        titulo: "Qtd. nova",
        chave: "nova",
        largura: 12,
        formato: FORMATOS.inteiro,
      },
      {
        titulo: "Variação no estoque",
        chave: "variacao",
        largura: 14,
        formato: FORMATOS.inteiroSinal,
      },
      { titulo: "Motivo", chave: "motivo", largura: 30 },
      { titulo: "Funcionário", chave: "funcionario", largura: 22 },
    ],
    linhas.map((l) => ({
      data: dataExcel(l.data_hora),
      tipo: ROTULO_TIPO[l.tipo],
      lote: l.id_lote,
      produto: l.produto,
      codigo: l.codigo,
      quantidade: l.quantidade,
      anterior: l.qtd_anterior,
      nova: l.qtd_nova,
      variacao: l.variacao,
      motivo: l.motivo,
      funcionario: l.funcionario,
    })),
  );

  adicionarTabela(
    livro,
    "Resumo por produto",
    [
      { titulo: "Produto", chave: "produto", largura: 30 },
      { titulo: "Código", chave: "codigo", centralizar: true, largura: 10 },
      {
        titulo: "Entradas",
        chave: "entradas",
        largura: 12,
        formato: FORMATOS.inteiro,
      },
      {
        titulo: "Saídas",
        chave: "saidas",
        largura: 12,
        formato: FORMATOS.inteiro,
      },
      {
        titulo: "Ajustes (líquido)",
        chave: "ajustes",
        largura: 14,
        formato: FORMATOS.inteiroSinal,
      },
      {
        titulo: "Variação no período",
        chave: "variacao",
        largura: 16,
        formato: FORMATOS.inteiroSinal,
      },
    ],
    resumo,
  );

  const periodo = filtros.data_inicio
    ? `${filtros.data_inicio.toLocaleDateString("pt-BR")} a ${filtros.data_fim.toLocaleDateString("pt-BR")}`
    : "(todo o histórico)";
  adicionarInformacoes(livro, {
    titulo: "Movimentações de estoque",
    geradoPor: await nomeDoUsuario(idUsuario),
    filtros: [
      ["Período", periodo],
      ["Tipo", filtros.tipo ? ROTULO_TIPO[filtros.tipo] : "(todos)"],
      ["Produto (id)", texto(filtros.id_produto)],
      ["Lote (id)", texto(filtros.id_lote)],
      ["Funcionário (id)", texto(filtros.id_funcionario)],
    ],
    totais: [
      ["Movimentações", linhas.length],
      ["Variação líquida no estoque (unidades)", soma(linhas, "variacao")],
    ],
  });
  return finalizar(livro, "movimentacoes");
}

// ------------------------------------------------------------ VENCIMENTOS

function situacaoVencimento(dias) {
  if (dias < 0) return "VENCIDO";
  if (dias === 0) return "VENCE HOJE";
  return "A VENCER";
}

async function vencimentos({ dias }, idUsuario) {
  const lotes = await relatorioRepository.vencimentos({
    dias,
    limite: limiteConsulta(),
  });
  conferirLimite(lotes);

  const livro = novoLivro();
  adicionarTabela(
    livro,
    "Vencimentos",
    [
      {
        titulo: "Lote",
        chave: "lote",
        centralizar: true,
        largura: 8,
        formato: FORMATOS.inteiro,
      },
      { titulo: "Produto", chave: "produto", largura: 30 },
      { titulo: "Código", chave: "codigo", centralizar: true, largura: 10 },
      {
        titulo: "Saldo",
        chave: "saldo",
        largura: 10,
        formato: FORMATOS.inteiro,
      },
      {
        titulo: "Validade",
        chave: "validade",
        largura: 12,
        formato: FORMATOS.data,
      },
      {
        titulo: "Dias restantes",
        chave: "dias",
        centralizar: true,
        largura: 12,
        formato: FORMATOS.inteiroSinal,
      },
      { titulo: "Situação", chave: "situacao", centralizar: true, largura: 14 },
      { titulo: "Fornecedor", chave: "fornecedor", largura: 24 },
      { titulo: "Nota", chave: "nota", centralizar: true, largura: 8 },
    ],
    lotes.map((l) => ({
      lote: l.id_lote,
      produto: l.produto,
      codigo: l.codigo,
      saldo: l.saldo,
      validade: dataExcel(l.validade),
      dias: l.dias_restantes,
      situacao: situacaoVencimento(l.dias_restantes),
      fornecedor: l.fornecedor,
      nota: l.id_nota,
    })),
    { colunaSituacao: "situacao" },
  );

  adicionarInformacoes(livro, {
    titulo: "Lotes vencidos e a vencer",
    geradoPor: await nomeDoUsuario(idUsuario),
    filtros: [["Janela", `vencidos + os que vencem em até ${dias} dia(s)`]],
    totais: [
      ["Lotes listados", lotes.length],
      ["Lotes já vencidos", lotes.filter((l) => l.dias_restantes < 0).length],
      ["Unidades em risco", soma(lotes, "saldo")],
    ],
  });
  return finalizar(livro, "vencimentos");
}

// ----------------------------------------------------------- NOTAS FISCAIS

async function notasFiscais(filtros, idUsuario) {
  const notas = await relatorioRepository.notasFiscais({
    ...filtros,
    limite: limiteConsulta(),
  });
  conferirLimite(notas);

  const porFornecedor = new Map();
  for (const n of notas) {
    const r = porFornecedor.get(n.fornecedor) || {
      fornecedor: n.fornecedor,
      notas: 0,
      quantidade: 0,
    };
    r.notas += 1;
    r.quantidade += Number(n.quantidade);
    porFornecedor.set(n.fornecedor, r);
  }
  const resumo = [...porFornecedor.values()].sort((a, b) =>
    a.fornecedor.localeCompare(b.fornecedor, "pt-BR"),
  );

  const livro = novoLivro();
  adicionarTabela(
    livro,
    "Notas fiscais",
    [
      {
        titulo: "Nota",
        chave: "nota",
        centralizar: true,
        largura: 8,
        formato: FORMATOS.inteiro,
      },
      {
        titulo: "Data da compra",
        chave: "data",
        largura: 16,
        formato: FORMATOS.dataHora,
      },
      { titulo: "Fornecedor", chave: "fornecedor", largura: 28 },
      {
        titulo: "Quantidade",
        chave: "quantidade",
        largura: 12,
        formato: FORMATOS.inteiro,
      },
      {
        titulo: "Arquivo anexado",
        chave: "arquivo",
        centralizar: true,
        largura: 14,
      },
      {
        titulo: "Lotes vinculados",
        chave: "lotes",
        centralizar: true,
        largura: 14,
        formato: FORMATOS.inteiro,
      },
    ],
    notas.map((n) => ({
      nota: n.id_nota,
      data: dataExcel(n.dt_compra),
      fornecedor: n.fornecedor,
      quantidade: n.quantidade,
      arquivo: n.tem_arquivo ? "Sim" : "Não",
      lotes: n.lotes,
    })),
  );

  adicionarTabela(
    livro,
    "Resumo por fornecedor",
    [
      { titulo: "Fornecedor", chave: "fornecedor", largura: 28 },
      {
        titulo: "Notas",
        chave: "notas",
        centralizar: true,
        largura: 10,
        formato: FORMATOS.inteiro,
      },
      {
        titulo: "Quantidade total",
        chave: "quantidade",
        largura: 16,
        formato: FORMATOS.inteiro,
      },
    ],
    resumo,
  );

  const periodo = filtros.data_inicio
    ? `${filtros.data_inicio.toLocaleDateString("pt-BR")} a ${filtros.data_fim.toLocaleDateString("pt-BR")}`
    : "(todo o histórico)";
  adicionarInformacoes(livro, {
    titulo: "Notas fiscais",
    geradoPor: await nomeDoUsuario(idUsuario),
    filtros: [
      ["Período", periodo],
      ["Fornecedor contém", filtros.fornecedor || "(todos)"],
    ],
    totais: [
      ["Notas listadas", notas.length],
      ["Quantidade total comprada", soma(notas, "quantidade")],
    ],
  });
  return finalizar(livro, "notas-fiscais");
}

module.exports = { estoque, movimentacoes, vencimentos, notasFiscais };
