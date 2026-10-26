const service = require("../services/relatorios.service");
const { lerPeriodo, lerFiltrosMovimentacao } = require("../utils/filtros");
const { idValido, numero } = require("../utils/validadores");

const XLSX =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const TIPOS = ["ENTRADA", "SAIDA", "AJUSTE"];

function enviarPlanilha(res, { nomeArquivo, buffer }) {
  res.set({
    "Content-Type": XLSX,
    "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    "Content-Length": buffer.length,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store", // dados internos: nunca guardar em cache
  });
  res.send(buffer);
}

/** Lê ?id_produto= (opcional). */
function lerIdProduto(query) {
  if (query.id_produto === undefined) return {};
  if (!idValido(query.id_produto)) return { erro: "id_produto inválido" };
  return { id_produto: Number(query.id_produto) };
}

exports.estoque = async (req, res) => {
  const { erro, id_produto } = lerIdProduto(req.query);
  if (erro) return res.status(400).json({ erro });
  enviarPlanilha(res, await service.estoque({ id_produto }, req.usuario.id));
};

exports.movimentacoes = async (req, res) => {
  const { erro, filtros } = lerFiltrosMovimentacao(req.query);
  if (erro) return res.status(400).json({ erro });

  const produto = lerIdProduto(req.query);
  if (produto.erro) return res.status(400).json({ erro: produto.erro });
  if (produto.id_produto) filtros.id_produto = produto.id_produto;

  if (req.query.tipo !== undefined) {
    if (!TIPOS.includes(req.query.tipo)) {
      return res
        .status(400)
        .json({ erro: `tipo inválido. Use: ${TIPOS.join(", ")}` });
    }
    filtros.tipo = req.query.tipo;
  }
  enviarPlanilha(res, await service.movimentacoes(filtros, req.usuario.id));
};

exports.vencimentos = async (req, res) => {
  const dias = req.query.dias === undefined ? 30 : numero(req.query.dias);
  if (!Number.isInteger(dias) || dias < 1 || dias > 365) {
    return res
      .status(400)
      .json({ erro: "dias deve ser um inteiro entre 1 e 365" });
  }
  enviarPlanilha(res, await service.vencimentos({ dias }, req.usuario.id));
};

exports.notasFiscais = async (req, res) => {
  const { erro, periodo } = lerPeriodo(req.query);
  if (erro) return res.status(400).json({ erro });

  const filtros = { ...periodo };
  if (typeof req.query.fornecedor === "string" && req.query.fornecedor.trim()) {
    filtros.fornecedor = req.query.fornecedor.trim();
  }
  enviarPlanilha(res, await service.notasFiscais(filtros, req.usuario.id));
};
