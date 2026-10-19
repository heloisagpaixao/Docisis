const service = require("../services/funcionarios.service");

// Traduz erros do MySQL em respostas HTTP claras
function tratarErro(err, res) {
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ erro: "CPF ou e-mail já cadastrado" });
  }
  if (err.code === "ER_NO_REFERENCED_ROW_2") {
    return res.status(400).json({ erro: "Cargo informado não existe" });
  }
  if (err.code === "ER_ROW_IS_REFERENCED_2") {
    return res
      .status(409)
      .json({
        erro: "Funcionário possui movimentações e não pode ser excluído",
      });
  }
  console.error(err);
  return res.status(500).json({ erro: "Erro interno do servidor" });
}

const idValido = (v) => Number.isInteger(Number(v)) && Number(v) > 0;

exports.listar = async (req, res) => {
  try {
    res.json(await service.listar());
  } catch (e) {
    tratarErro(e, res);
  }
};

exports.buscar = async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ erro: "ID inválido" });
  try {
    const f = await service.buscarPorId(req.params.id);
    if (!f) return res.status(404).json({ erro: "Funcionário não encontrado" });
    res.json(f);
  } catch (e) {
    tratarErro(e, res);
  }
};

exports.criar = async (req, res) => {
  const { nome, cpf, email, senha, telefone, id_cargo } = req.body;
  if (!nome || !cpf || !email || !senha || !telefone || !id_cargo) {
    return res
      .status(400)
      .json({ erro: "Informe nome, cpf, email, senha, telefone e id_cargo" });
  }
  if (senha.length < 8) {
    return res
      .status(400)
      .json({ erro: "A senha deve ter pelo menos 8 caracteres" });
  }
  try {
    res.status(201).json(await service.criar(req.body));
  } catch (e) {
    tratarErro(e, res);
  }
};

exports.atualizar = async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ erro: "ID inválido" });
  if (req.body.senha && req.body.senha.length < 8) {
    return res
      .status(400)
      .json({ erro: "A senha deve ter pelo menos 8 caracteres" });
  }
  try {
    const f = await service.atualizar(req.params.id, req.body);
    if (!f) return res.status(404).json({ erro: "Funcionário não encontrado" });
    res.json(f);
  } catch (e) {
    tratarErro(e, res);
  }
};

exports.alterarCargo = async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ erro: "ID inválido" });
  if (!idValido(req.body.id_cargo))
    return res.status(400).json({ erro: "Informe um id_cargo válido" });
  try {
    const f = await service.alterarCargo(req.params.id, req.body.id_cargo);
    if (!f) return res.status(404).json({ erro: "Funcionário não encontrado" });
    res.json(f);
  } catch (e) {
    tratarErro(e, res);
  }
};

exports.excluir = async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ erro: "ID inválido" });
  if (Number(req.params.id) === req.usuario.id) {
    return res
      .status(400)
      .json({ erro: "Você não pode excluir o próprio usuário" });
  }
  try {
    const ok = await service.excluir(req.params.id);
    if (!ok)
      return res.status(404).json({ erro: "Funcionário não encontrado" });
    res.status(204).send();
  } catch (e) {
    tratarErro(e, res);
  }
};
