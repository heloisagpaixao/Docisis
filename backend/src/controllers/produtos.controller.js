const service = require("../services/produtos.service");
const arquivos = require("../services/arquivos.service");
const { lerPaginacao } = require("../utils/paginacao");
const { idValido, numero } = require("../utils/validadores");

const MAX_INT = 2147483647;

/** Valida e normaliza o corpo. Devolve { erro } ou { dados }. */
function validar(body, { completo }) {
  const b = body || {};
  const dados = {};

  if (completo) {
    for (const c of ["nome", "codigo"]) {
      if (b[c] === undefined || b[c] === null || b[c] === "")
        return { erro: `Informe ${c}` };
    }
  }
  if (b.nome !== undefined) {
    if (
      typeof b.nome !== "string" ||
      b.nome.trim().length < 2 ||
      b.nome.trim().length > 100
    ) {
      return { erro: "Nome deve ter entre 2 e 100 caracteres" };
    }
    dados.nome = b.nome.trim();
  }
  if (b.codigo !== undefined) {
    const n = numero(b.codigo);
    if (!Number.isInteger(n) || n <= 0 || n > MAX_INT) {
      return { erro: "Código deve ser um número inteiro positivo" };
    }
    dados.codigo = n;
  }
  if (b.peso !== undefined) {
    if (b.peso === null) {
      dados.peso = null;
    } else {
      const n = numero(b.peso);
      if (!(n > 0 && n < 1000000))
        return { erro: "Peso deve ser um número positivo" };
      dados.peso = Math.round(n * 100) / 100; // a coluna guarda 2 casas decimais
    }
  }
  for (const campo of ["estoque_minimo", "estoque_maximo"]) {
    if (b[campo] !== undefined) {
      if (b[campo] === null) {
        dados[campo] = null; // null = o produto não gera alerta desse tipo
      } else {
        const n = numero(b[campo]);
        if (!Number.isInteger(n) || n < 0 || n > MAX_INT) {
          return {
            erro: `${campo} deve ser um inteiro maior ou igual a zero (ou null)`,
          };
        }
        dados[campo] = n;
      }
    }
  }
  // imagem não é aceita aqui: use PUT /produtos/:id/imagem
  return { dados };
}

exports.listar = async (req, res) => {
  const { nome, codigo } = req.query;
  const filtros = { ...lerPaginacao(req.query) };
  if (typeof nome === "string" && nome.trim()) filtros.nome = nome.trim();
  if (codigo !== undefined) {
    const n = numero(codigo);
    if (!Number.isInteger(n) || n <= 0)
      return res.status(400).json({ erro: "Código inválido" });
    filtros.codigo = n;
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

// ----- imagem do produto (upload) -----

exports.enviarImagem = async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ erro: "ID inválido" });
  res.json(await service.salvarImagem(req.params.id, req.arquivo));
};

exports.baixarImagem = async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ erro: "ID inválido" });
  await arquivos.enviar(res, await service.caminhoImagem(req.params.id));
};

exports.removerImagem = async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ erro: "ID inválido" });
  await service.removerImagem(req.params.id);
  res.status(204).send();
};
