const service = require("../services/movimentacoes.service");
const { lerPaginacao } = require("../utils/paginacao");
const { lerFiltrosMovimentacao } = require("../utils/filtros");
const { lerBusca } = require("../utils/busca");
const { idValido } = require("../utils/validadores");

const TIPOS = ["ENTRADA", "SAIDA", "AJUSTE"];

exports.listar = async (req, res) => {
  const { erro, filtros } = lerFiltrosMovimentacao(req.query); // id_funcionario, id_lote, período
  if (erro) return res.status(400).json({ erro });

  if (req.query.id_produto !== undefined) {
    if (!idValido(req.query.id_produto))
      return res.status(400).json({ erro: "id_produto inválido" });
    filtros.id_produto = Number(req.query.id_produto);
  }
  if (req.query.tipo !== undefined) {
    if (!TIPOS.includes(req.query.tipo)) {
      return res
        .status(400)
        .json({ erro: `tipo inválido. Use: ${TIPOS.join(", ")}` });
    }
    filtros.tipo = req.query.tipo;
  }
  const b = lerBusca(req.query);
  if (b.erro) return res.status(400).json({ erro: b.erro });
  if (b.busca) filtros.busca = b.busca;

  res.json(
    await service.listar(
      { ...lerPaginacao(req.query), ...filtros },
      req.usuario.id,
    ),
  );
};
