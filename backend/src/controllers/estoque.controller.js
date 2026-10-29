const service = require("../services/estoque.service");
const { lerPaginacao } = require("../utils/paginacao");
const { lerBusca } = require("../utils/busca");
const { idValido, numero } = require("../utils/validadores");

const SITUACOES = ["vencido", "a_vencer", "ok"];
const ORDENS = ["validade", "produto", "saldo"];

exports.listar = async (req, res) => {
  const filtros = { ...lerPaginacao(req.query) };

  const { erro, busca } = lerBusca(req.query);
  if (erro) return res.status(400).json({ erro });
  if (busca) filtros.busca = busca;

  if (req.query.situacao !== undefined) {
    if (!SITUACOES.includes(req.query.situacao)) {
      return res
        .status(400)
        .json({ erro: `situacao inválida. Use: ${SITUACOES.join(", ")}` });
    }
    filtros.situacao = req.query.situacao;
  }
  if (req.query.ordem !== undefined) {
    if (!ORDENS.includes(req.query.ordem)) {
      return res
        .status(400)
        .json({ erro: `ordem inválida. Use: ${ORDENS.join(", ")}` });
    }
    filtros.ordem = req.query.ordem;
  }
  if (req.query.id_produto !== undefined) {
    if (!idValido(req.query.id_produto))
      return res.status(400).json({ erro: "id_produto inválido" });
    filtros.id_produto = Number(req.query.id_produto);
  }

  res.json(await service.listar(filtros));
};

exports.resumo = async (req, res) => res.json(await service.resumo());

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
