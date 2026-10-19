const service = require("../services/produtos.service");

function tratarErro(err, res) {
  if (err.code === "ER_DUP_ENTRY") {
    return res
      .status(409)
      .json({ erro: "Já existe um produto com esse código" });
  }
  if (err.code === "ER_ROW_IS_REFERENCED_2") {
    return res
      .status(409)
      .json({
        erro: "Produto possui registros vinculados e não pode ser excluído",
      });
  }
  if (
    err.code === "ER_TRUNCATED_WRONG_VALUE" ||
    err.code === "ER_WRONG_VALUE"
  ) {
    return res.status(400).json({ erro: "Data inválida" });
  }
  console.error(err);
  return res.status(500).json({ erro: "Erro interno do servidor" });
}

const idValido = (v) => Number.isInteger(Number(v)) && Number(v) > 0;

// completo = true no cadastro (campos obrigatórios); false na edição parcial
function validar(b, completo) {
  if (completo) {
    for (const campo of ["nome", "dt_validade", "codigo"]) {
      if (b[campo] === undefined || b[campo] === "") return `Informe ${campo}`;
    }
  }
  if (
    b.nome !== undefined &&
    (typeof b.nome !== "string" || !b.nome.trim() || b.nome.length > 100)
  ) {
    return "Nome inválido (até 100 caracteres)";
  }
  if (
    b.codigo !== undefined &&
    !(
      Number.isInteger(Number(b.codigo)) &&
      Number(b.codigo) > 0 &&
      Number(b.codigo) <= 2147483647
    )
  ) {
    return "Código deve ser um número inteiro positivo";
  }
  if (
    b.dt_validade !== undefined &&
    !/^\d{4}-\d{2}-\d{2}$/.test(b.dt_validade)
  ) {
    return "dt_validade deve estar no formato AAAA-MM-DD";
  }
  if (
    b.peso !== undefined &&
    b.peso !== null &&
    !(Number(b.peso) > 0 && Number(b.peso) < 1000000)
  ) {
    return "Peso deve ser um número positivo";
  }
  return null;
}

exports.listar = async (req, res) => {
  try {
    res.json(await service.listar(req.query));
  } catch (e) {
    tratarErro(e, res);
  }
};

exports.buscar = async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ erro: "ID inválido" });
  try {
    const p = await service.buscarPorId(req.params.id);
    if (!p) return res.status(404).json({ erro: "Produto não encontrado" });
    res.json(p);
  } catch (e) {
    tratarErro(e, res);
  }
};

exports.criar = async (req, res) => {
  const body = req.body || {};
  const erro = validar(body, true);
  if (erro) return res.status(400).json({ erro });
  try {
    res.status(201).json(await service.criar(body));
  } catch (e) {
    tratarErro(e, res);
  }
};

exports.atualizar = async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ erro: "ID inválido" });
  const body = req.body || {};
  const erro = validar(body, false);
  if (erro) return res.status(400).json({ erro });
  try {
    const p = await service.atualizar(req.params.id, body);
    if (!p) return res.status(404).json({ erro: "Produto não encontrado" });
    res.json(p);
  } catch (e) {
    tratarErro(e, res);
  }
};

exports.excluir = async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ erro: "ID inválido" });
  try {
    const ok = await service.excluir(req.params.id);
    if (!ok) return res.status(404).json({ erro: "Produto não encontrado" });
    res.status(204).send();
  } catch (e) {
    tratarErro(e, res);
  }
};
