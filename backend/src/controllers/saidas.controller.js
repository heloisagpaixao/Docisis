const service = require("../services/saidas.service");
const { lerPaginacao } = require("../utils/paginacao");
const { lerFiltrosMovimentacao } = require("../utils/filtros");
const { idValido, numero } = require("../utils/validadores");

const MAX_INT = 2147483647;
const motivoValido = (m) =>
  typeof m === "string" && m.trim().length >= 3 && m.trim().length <= 100;
const quantidadeValida = (q) => Number.isInteger(q) && q > 0 && q <= MAX_INT;

exports.listar = async (req, res) => {
  const { erro, filtros } = lerFiltrosMovimentacao(req.query);
  if (erro) return res.status(400).json({ erro });
  res.json(await service.listar({ ...lerPaginacao(req.query), ...filtros }));
};

exports.buscar = async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ erro: "ID inválido" });
  res.json(await service.buscar(req.params.id));
};

exports.criar = async (req, res) => {
  const b = req.body || {};
  if (!idValido(b.id_lote))
    return res.status(400).json({ erro: "Informe um id_lote válido" });
  const quantidade = numero(b.quantidade);
  if (!quantidadeValida(quantidade)) {
    return res
      .status(400)
      .json({ erro: "Quantidade deve ser um número inteiro positivo" });
  }
  if (!motivoValido(b.motivo)) {
    return res
      .status(400)
      .json({ erro: "Informe o motivo (de 3 a 100 caracteres)" });
  }
  const saida = await service.criar(
    { id_lote: Number(b.id_lote), quantidade, motivo: b.motivo.trim() },
    req.usuario.id,
  );
  res.status(201).json(saida);
};

exports.atualizar = async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ erro: "ID inválido" });
  const b = req.body || {};
  const dados = {};
  if (b.quantidade !== undefined) {
    const q = numero(b.quantidade);
    if (!quantidadeValida(q))
      return res
        .status(400)
        .json({ erro: "Quantidade deve ser um número inteiro positivo" });
    dados.quantidade = q;
  }
  if (b.motivo !== undefined) {
    if (!motivoValido(b.motivo))
      return res
        .status(400)
        .json({ erro: "Motivo deve ter de 3 a 100 caracteres" });
    dados.motivo = b.motivo.trim();
  }
  if (Object.keys(dados).length === 0) {
    return res.status(400).json({ erro: "Informe quantidade e/ou motivo" });
  }
  res.json(await service.atualizar(req.params.id, dados));
};

exports.excluir = async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ erro: "ID inválido" });
  await service.excluir(req.params.id);
  res.status(204).send();
};
