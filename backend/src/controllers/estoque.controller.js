const service = require("../services/estoque.service");
const { lerPaginacao } = require("../utils/paginacao");
const { idValido, numero } = require("../utils/validadores");

exports.listar = async (req, res) =>
  res.json(await service.listar(lerPaginacao(req.query)));

exports.baixo = async (req, res) => {
  const limite = req.query.limite === undefined ? 10 : numero(req.query.limite);
  if (!Number.isInteger(limite) || limite < 1 || limite > 1000000) {
    return res
      .status(400)
      .json({ erro: "limite deve ser um inteiro positivo" });
  }
  res.json(await service.baixo(limite));
};

exports.buscarPorLote = async (req, res) => {
  if (!idValido(req.params.idLote))
    return res.status(400).json({ erro: "ID inválido" });
  res.json(await service.buscarPorLote(req.params.idLote));
};
