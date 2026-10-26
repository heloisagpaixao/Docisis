const service = require("../services/funcionarios.service");
const arquivos = require("../services/arquivos.service");
const { lerPaginacao } = require("../utils/paginacao");
const {
  idValido,
  cpfValido,
  formatarCpf,
  emailValido,
  telefoneValido,
} = require("../utils/validadores");

const texto = (v, min, max) =>
  typeof v === "string" && v.trim().length >= min && v.trim().length <= max;
// bcrypt só considera os 72 primeiros bytes da senha
const senhaValida = (s) =>
  typeof s === "string" && s.length >= 8 && Buffer.byteLength(s) <= 72;

/** Valida e normaliza o corpo. Devolve { erro } ou { dados }. */
function validar(body, { completo }) {
  const b = body || {};
  const dados = {};

  if (completo) {
    for (const c of ["nome", "cpf", "email", "senha", "telefone", "id_cargo"]) {
      if (b[c] === undefined || b[c] === null || b[c] === "")
        return { erro: `Informe ${c}` };
    }
  }
  if (b.nome !== undefined) {
    if (!texto(b.nome, 2, 100))
      return { erro: "Nome deve ter entre 2 e 100 caracteres" };
    dados.nome = b.nome.trim();
  }
  if (completo && b.cpf !== undefined) {
    if (!cpfValido(b.cpf)) return { erro: "CPF inválido" };
    dados.cpf = formatarCpf(b.cpf);
  }
  if (b.email !== undefined) {
    if (!emailValido(b.email.trim?.())) return { erro: "E-mail inválido" };
    dados.email = b.email.trim().toLowerCase();
  }
  if (b.senha !== undefined) {
    if (!senhaValida(b.senha))
      return { erro: "A senha deve ter de 8 a 72 caracteres" };
    dados.senha = b.senha;
  }
  if (b.telefone !== undefined) {
    if (!telefoneValido(b.telefone))
      return { erro: "Telefone inválido (informe o DDD)" };
    dados.telefone = String(b.telefone).trim();
  }
  // foto_perfil não é aceita aqui: use PUT /funcionarios/:id/foto
  if (completo) {
    if (!idValido(b.id_cargo)) return { erro: "id_cargo inválido" };
    dados.id_cargo = Number(b.id_cargo);
  }
  return { dados };
}

exports.listar = async (req, res) => {
  res.json(await service.listar(lerPaginacao(req.query)));
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

exports.alterarCargo = async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ erro: "ID inválido" });
  const id_cargo = (req.body || {}).id_cargo;
  if (!idValido(id_cargo))
    return res.status(400).json({ erro: "Informe um id_cargo válido" });
  res.json(
    await service.alterarCargo(req.params.id, Number(id_cargo), req.usuario.id),
  );
};

exports.excluir = async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ erro: "ID inválido" });
  await service.excluir(req.params.id, req.usuario.id);
  res.status(204).send();
};

// ----- foto de perfil (upload) -----

exports.enviarFoto = async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ erro: "ID inválido" });
  res.json(await service.salvarFoto(req.params.id, req.arquivo));
};

exports.baixarFoto = async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ erro: "ID inválido" });
  await arquivos.enviar(res, await service.caminhoFoto(req.params.id));
};

exports.removerFoto = async (req, res) => {
  if (!idValido(req.params.id))
    return res.status(400).json({ erro: "ID inválido" });
  await service.removerFoto(req.params.id);
  res.status(204).send();
};
