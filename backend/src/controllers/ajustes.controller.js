const service = require("../services/ajustes.service");
const { lerPaginacao } = require("../utils/paginacao");
const { lerFiltrosMovimentacao } = require("../utils/filtros");
const { idValido, numero } = require("../utils/validadores");

const MAX_INT = 2147483647;

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
  const nova = numero(b.quantidade_nova);
  if (!Number.isInteger(nova) || nova < 0 || nova > MAX_INT) {
    return res
      .status(400)
      .json({
        erro: "quantidade_nova deve ser um inteiro maior ou igual a zero",
      });
  }
  if (
    typeof b.motivo !== "string" ||
    b.motivo.trim().length < 3 ||
    b.motivo.trim().length > 100
  ) {
    return res
      .status(400)
      .json({ erro: "Informe o motivo (de 3 a 100 caracteres)" });
  }
  const ajuste = await service.criar(
    {
      id_lote: Number(b.id_lote),
      quantidade_nova: nova,
      motivo: b.motivo.trim(),
    },
    req.usuario.id,
  );
  res.status(201).json(ajuste);
};
