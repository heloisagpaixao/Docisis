const service = require("../services/entradas.service");
const { lerPaginacao } = require("../utils/paginacao");
const { lerFiltrosMovimentacao } = require("../utils/filtros");
const { idValido, numero } = require("../utils/validadores");

const MAX_INT = 2147483647;
const motivoValido = (m) =>
  typeof m === "string" && m.trim().length >= 3 && m.trim().length <= 100;

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
  if (
    !Number.isInteger(quantidade) ||
    quantidade <= 0 ||
    quantidade > MAX_INT
  ) {
    return res
      .status(400)
      .json({ erro: "Quantidade deve ser um número inteiro positivo" });
  }
  if (!motivoValido(b.motivo)) {
    return res
      .status(400)
      .json({ erro: "Informe o motivo (de 3 a 100 caracteres)" });
  }
  const entrada = await service.criar(
    { id_lote: Number(b.id_lote), quantidade, motivo: b.motivo.trim() },
    req.usuario.id,
  );
  res.status(201).json(entrada);
};

exports.atualizar = async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ erro: "ID inválido" });
  const b = req.body || {};
  if (!motivoValido(b.motivo)) {
    return res
      .status(400)
      .json({
        erro: "Informe o motivo (de 3 a 100 caracteres). Só ele pode ser corrigido",
      });
  }
  res.json(await service.atualizar(req.params.id, { motivo: b.motivo.trim() }));
};

exports.excluir = async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ erro: "ID inválido" });
  await service.excluir(req.params.id);
  res.status(204).send();
};
