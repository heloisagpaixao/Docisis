const service = require("../services/notasfiscais.service");
const { lerPaginacao } = require("../utils/paginacao");
const { idValido, numero, lerData } = require("../utils/validadores");

const MAX_INT = 2147483647;
const UM_DIA = 24 * 60 * 60 * 1000;

/** Valida e normaliza o corpo. Devolve { erro } ou { dados }. */
function validar(body, { completo }) {
  const b = body || {};
  const dados = {};

  if (completo) {
    for (const c of ["fornecedor", "quantidade"]) {
      if (b[c] === undefined || b[c] === null || b[c] === "")
        return { erro: `Informe ${c}` };
    }
  }
  if (b.fornecedor !== undefined) {
    if (
      typeof b.fornecedor !== "string" ||
      b.fornecedor.trim().length < 2 ||
      b.fornecedor.trim().length > 50
    ) {
      return { erro: "Fornecedor deve ter entre 2 e 50 caracteres" };
    }
    dados.fornecedor = b.fornecedor.trim();
  }
  if (b.quantidade !== undefined) {
    const n = numero(b.quantidade);
    if (!Number.isInteger(n) || n <= 0 || n > MAX_INT) {
      return { erro: "Quantidade deve ser um número inteiro positivo" };
    }
    dados.quantidade = n;
  }
  if (b.dt_compra !== undefined) {
    const data = lerData(b.dt_compra);
    if (!data)
      return {
        erro: "dt_compra inválida (use AAAA-MM-DD ou AAAA-MM-DD HH:MM)",
      };
    if (data.getTime() > Date.now() + UM_DIA) {
      return { erro: "dt_compra não pode estar no futuro" };
    }
    dados.dt_compra = data;
  }
  if (b.arquivo !== undefined) {
    if (b.arquivo === null) {
      dados.arquivo = null;
    } else if (
      typeof b.arquivo !== "string" ||
      !b.arquivo.trim() ||
      b.arquivo.length > 255
    ) {
      return { erro: "arquivo inválido" };
    } else {
      dados.arquivo = b.arquivo.trim();
    }
  }
  return { dados };
}

exports.listar = async (req, res) => {
  const filtros = { ...lerPaginacao(req.query) };
  if (typeof req.query.fornecedor === "string" && req.query.fornecedor.trim()) {
    filtros.fornecedor = req.query.fornecedor.trim();
  }
  res.json(await service.listar(filtros));
};

exports.buscar = async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ erro: "ID inválido" });
  res.json(await service.buscar(req.params.id));
};

exports.criar = async (req, res) => {
  const { erro, dados } = validar(req.body, { completo: true });
  if (erro) return res.status(400).json({ erro });
  res.status(201).json(await service.criar(dados));
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
