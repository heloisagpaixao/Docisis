const service = require("../services/lotes.service");
const { lerPaginacao } = require("../utils/paginacao");
const { idValido, numero, lerData } = require("../utils/validadores");

const MAX_INT = 2147483647;
const SO_DATA = /^\d{4}-\d{2}-\d{2}$/;

/** Valida a data de validade: formato AAAA-MM-DD, existente e não vencida. */
function validarValidade(valor) {
  if (
    typeof valor !== "string" ||
    !SO_DATA.test(valor.trim()) ||
    !lerData(valor)
  ) {
    return { erro: "dt_validade inválida (use AAAA-MM-DD)" };
  }
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  if (lerData(valor) < hoje)
    return { erro: "dt_validade não pode estar no passado" };
  return { valor: valor.trim() };
}

function validar(body, { completo }) {
  const b = body || {};
  const dados = {};

  if (b.quantidade !== undefined && !completo) {
    return {
      erro: "A quantidade só pode ser alterada por entrada, saída ou ajuste",
    };
  }
  if (completo) {
    for (const c of ["id_produto", "id_nota", "dt_validade"]) {
      if (b[c] === undefined || b[c] === null || b[c] === "")
        return { erro: `Informe ${c}` };
    }
    if (b.quantidade !== undefined) {
      const q = numero(b.quantidade);
      if (!Number.isInteger(q) || q < 0 || q > MAX_INT) {
        return {
          erro: "Quantidade deve ser um número inteiro maior ou igual a zero",
        };
      }
      dados.quantidade = q;
    }
  }
  for (const campo of ["id_produto", "id_nota"]) {
    if (b[campo] !== undefined) {
      if (!idValido(b[campo])) return { erro: `${campo} inválido` };
      dados[campo] = Number(b[campo]);
    }
  }
  if (b.dt_validade !== undefined) {
    const v = validarValidade(b.dt_validade);
    if (v.erro) return v;
    dados.dt_validade = v.valor;
  }
  return { dados };
}

exports.listar = async (req, res) => {
  const filtros = { ...lerPaginacao(req.query) };
  if (req.query.id_produto !== undefined) {
    if (!idValido(req.query.id_produto))
      return res.status(400).json({ erro: "id_produto inválido" });
    filtros.id_produto = Number(req.query.id_produto);
  }
  res.json(await service.listar(filtros));
};

exports.vencendo = async (req, res) => {
  const dias = req.query.dias === undefined ? 30 : numero(req.query.dias);
  if (!Number.isInteger(dias) || dias < 1 || dias > 365) {
    return res
      .status(400)
      .json({ erro: "dias deve ser um inteiro entre 1 e 365" });
  }
  res.json(await service.vencendo(dias));
};

exports.buscar = async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ erro: "ID inválido" });
  res.json(await service.buscar(req.params.id));
};

exports.movimentacoes = async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ erro: "ID inválido" });
  res.json(await service.movimentacoes(req.params.id));
};

exports.criar = async (req, res) => {
  const { erro, dados } = validar(req.body, { completo: true });
  if (erro) return res.status(400).json({ erro });
  res.status(201).json(await service.criar(dados, req.usuario.id));
};

exports.atualizar = async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ erro: "ID inválido" });
  const { erro, dados } = validar(req.body, { completo: false });
  if (erro) return res.status(400).json({ erro });
  if (Object.keys(dados).length === 0) {
    return res
      .status(400)
      .json({ erro: "Informe ao menos um campo para atualizar" });
  }
  res.json(await service.atualizar(req.params.id, dados));
};

exports.excluir = async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ erro: "ID inválido" });
  await service.excluir(req.params.id);
  res.status(204).send();
};
