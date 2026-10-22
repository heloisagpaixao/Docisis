const service = require("../services/notificacoes.service");
const { lerPaginacao } = require("../utils/paginacao");
const { idValido } = require("../utils/validadores");

/** Lê "true"/"false" da URL. Devolve { valor } ou { erro }. */
function lerBooleano(texto, nome) {
  if (texto === undefined) return { valor: undefined };
  if (texto === "true") return { valor: true };
  if (texto === "false") return { valor: false };
  return { erro: `${nome} deve ser true ou false` };
}

exports.listar = async (req, res) => {
  const { tipo, severidade } = req.query;
  const lida = lerBooleano(req.query.lida, "lida");
  const historico = lerBooleano(req.query.historico, "historico");
  if (lida.erro || historico.erro)
    return res.status(400).json({ erro: lida.erro || historico.erro });
  if (tipo !== undefined && !service.TIPOS.includes(tipo)) {
    return res
      .status(400)
      .json({ erro: `tipo inválido. Use: ${service.TIPOS.join(", ")}` });
  }
  if (severidade !== undefined && !service.SEVERIDADES.includes(severidade)) {
    return res
      .status(400)
      .json({
        erro: `severidade inválida. Use: ${service.SEVERIDADES.join(", ")}`,
      });
  }

  res.json(
    await service.listar({
      ...lerPaginacao(req.query),
      id_funcionario: req.usuario.id,
      lida: lida.valor,
      historico: historico.valor === true,
      tipo,
      severidade,
    }),
  );
};

exports.resumo = async (req, res) =>
  res.json(await service.resumo(req.usuario.id));

exports.buscar = async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ erro: "ID inválido" });
  res.json(await service.buscar(req.params.id, req.usuario.id));
};

exports.marcarLida = async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ erro: "ID inválido" });
  res.json(await service.marcarLida(req.params.id, req.usuario.id));
};

exports.marcarTodasLidas = async (req, res) =>
  res.json(await service.marcarTodasLidas(req.usuario.id));

exports.verificar = async (req, res) => res.json(await service.verificar());
