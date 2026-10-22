const service = require("../services/cargos.service");
const { lerPaginacao } = require("../utils/paginacao");
const { idValido } = require("../utils/validadores");

function validar(body, { completo }) {
  const b = body || {};
  const dados = {};

  if (completo && !b.nome) return { erro: "Informe nome" };
  if (b.nome !== undefined) {
    if (
      typeof b.nome !== "string" ||
      b.nome.trim().length < 2 ||
      b.nome.trim().length > 50
    ) {
      return { erro: "Nome deve ter entre 2 e 50 caracteres" };
    }
    dados.nome = b.nome.trim();
  }
  if (b.permissoes !== undefined) {
    if (
      !Array.isArray(b.permissoes) ||
      b.permissoes.length > 50 ||
      !b.permissoes.every((p) => typeof p === "string" && p.length > 0)
    ) {
      return {
        erro: 'permissoes deve ser uma lista de nomes, ex.: ["ESTOQUE_CONSULTAR"]',
      };
    }
    dados.permissoes = b.permissoes;
  }
  return { dados };
}

exports.listar = async (req, res) =>
  res.json(await service.listar(lerPaginacao(req.query)));
exports.catalogo = async (req, res) =>
  res.json(await service.catalogoPermissoes());

exports.buscar = async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ erro: "ID inválido" });
  res.json(await service.buscar(req.params.id));
};

exports.criar = async (req, res) => {
  const { erro, dados } = validar(req.body, { completo: true });
  if (erro) return res.status(400).json({ erro });
  res.status(201).json(await service.criar({ permissoes: [], ...dados }));
};

exports.atualizar = async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ erro: "ID inválido" });
  const { erro, dados } = validar(req.body, { completo: false });
  if (erro) return res.status(400).json({ erro });
  if (Object.keys(dados).length === 0) {
    return res.status(400).json({ erro: "Informe nome e/ou permissoes" });
  }
  res.json(await service.atualizar(req.params.id, dados));
};

exports.excluir = async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ erro: "ID inválido" });
  await service.excluir(req.params.id);
  res.status(204).send();
};
