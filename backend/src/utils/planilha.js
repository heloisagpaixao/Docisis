const ExcelJS = require("exceljs");

// Paleta do Docisis
const AZUL = "FF1F4E79";
const LARANJA = "FFE8731A";
const BRANCO = "FFFFFFFF";

// Cores das situações (fundo claro + texto escuro, legíveis na tela e impressos)
const SITUACOES = {
  VENCIDO: { fundo: "FFF8D7DA", texto: "FF842029" },
  "SEM ESTOQUE": { fundo: "FFF8D7DA", texto: "FF842029" },
  "VENCE HOJE": { fundo: "FFFFE0CC", texto: "FF8A3B00" },
  "VENCE EM BREVE": { fundo: "FFFFE0CC", texto: "FF8A3B00" },
  "A VENCER": { fundo: "FFFFE0CC", texto: "FF8A3B00" },
  "ESTOQUE BAIXO": { fundo: "FFFFE0CC", texto: "FF8A3B00" },
  "ACIMA DO MÁXIMO": { fundo: "FFD6E4F0", texto: "FF1F4E79" },
};

/**
 * O Excel guarda data/hora SEM fuso. Para a célula mostrar exatamente o que está no
 * banco (e não deslocar 3 h), o Date é montado em UTC com os mesmos números.
 */
function dataExcel(texto) {
  const m =
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(
      texto || "",
    );
  if (!m) return null;
  return new Date(
    Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)),
  );
}

const FORMATOS = {
  data: "dd/mm/yyyy",
  dataHora: "dd/mm/yyyy hh:mm",
  inteiro: "#,##0",
  inteiroSinal: "+#,##0;-#,##0;0",
};

function novoLivro() {
  const livro = new ExcelJS.Workbook();
  livro.creator = "Docisis";
  livro.created = new Date();
  return livro;
}

function textoDaCelula(v) {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return "00/00/0000 00:00";
  return String(v);
}

/**
 * Cria uma aba com cabeçalho azul, linha fixa, filtro automático, larguras ajustadas
 * e a coluna `colunaSituacao` (opcional) colorida. Os textos são gravados como TEXTO:
 * um nome de produto como  =HYPERLINK("http://...")  nunca é executado pelo Excel.
 */
function adicionarTabela(
  livro,
  nome,
  colunas,
  linhas,
  { colunaSituacao } = {},
) {
  const aba = livro.addWorksheet(nome, {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  aba.columns = colunas.map((c) => ({
    header: c.titulo,
    key: c.chave,
    width: c.largura || 14,
    style: {
      ...(c.formato ? { numFmt: c.formato } : {}),
      ...(c.centralizar ? { alignment: { horizontal: "center" } } : {}),
    },
  }));

  const cabecalho = aba.getRow(1);
  cabecalho.height = 24;
  cabecalho.eachCell((celula) => {
    celula.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: AZUL },
    };
    celula.font = { bold: true, color: { argb: BRANCO } };
    celula.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    celula.border = { bottom: { style: "medium", color: { argb: LARANJA } } };
  });

  for (const linha of linhas) aba.addRow(linha);

  if (colunaSituacao) {
    aba.eachRow((linha, n) => {
      if (n === 1) return;
      const celula = linha.getCell(colunaSituacao);
      const cor = SITUACOES[celula.value];
      if (cor) {
        celula.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: cor.fundo },
        };
        celula.font = { bold: true, color: { argb: cor.texto } };
      }
    });
  }

  // largura = maior conteúdo da coluna (entre 10 e 50 caracteres)
  aba.columns.forEach((coluna, i) => {
    let maior = String(colunas[i].titulo).length;
    coluna.eachCell({ includeEmpty: false }, (celula, n) => {
      if (n > 1) maior = Math.max(maior, textoDaCelula(celula.value).length);
    });
    coluna.width = Math.min(Math.max(maior + 3, 10), 50);
  });

  if (colunas.length) {
    aba.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: colunas.length },
    };
  }
  return aba;
}

/** Aba final com a "certidão" do relatório: quem gerou, quando, com quais filtros. */
function adicionarInformacoes(
  livro,
  { titulo, geradoPor, filtros = [], totais = [] },
) {
  const aba = livro.addWorksheet("Informações");
  aba.getColumn(1).width = 28;
  aba.getColumn(2).width = 60;

  const agora = new Date();
  const linhas = [
    ["Relatório", titulo],
    ["Gerado em", agora.toLocaleString("pt-BR")],
    ["Gerado por", geradoPor],
    ...filtros.map(([nome, valor]) => [nome, valor]),
    ...totais.map(([nome, valor]) => [nome, valor]),
  ];
  linhas.forEach((l, i) => {
    const linha = aba.addRow(l);
    linha.getCell(1).font = { bold: true, color: { argb: AZUL } };
    if (i === 0) linha.getCell(2).font = { bold: true, size: 13 };
  });
  aba.getCell("A1").border = {
    bottom: { style: "medium", color: { argb: LARANJA } },
  };
  aba.getCell("B1").border = {
    bottom: { style: "medium", color: { argb: LARANJA } },
  };
  return aba;
}

/** AAAA-MM-DD de hoje (horário local), para o nome do arquivo. */
function hojeTexto() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function paraBuffer(livro) {
  return Buffer.from(await livro.xlsx.writeBuffer());
}

module.exports = {
  FORMATOS,
  dataExcel,
  novoLivro,
  adicionarTabela,
  adicionarInformacoes,
  hojeTexto,
  paraBuffer,
};
