const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const funcionarioRepository = require("../repositories/funcionarios.repository");
const refreshTokenRepository = require("../repositories/refreshtoken.repository");

const erro = (status, mensagem) => ({ status, mensagem });

const diasRefresh = () => Number(process.env.REFRESH_TOKEN_DIAS) || 7;
// Janela em que reapresentar um token recém-trocado é tratado como corrida
// legítima (ex.: duas abas renovando ao mesmo tempo) e NÃO como roubo.
const graceSegundos = () =>
  process.env.REFRESH_GRACE_SEG === undefined
    ? 10
    : Number(process.env.REFRESH_GRACE_SEG);

// O refresh token é um valor aleatório (não um JWT) e só o hash dele vai para o banco.
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

/** Gera o par de tokens e registra o refresh token (em hash) na sessão `familia`. */
async function emitirTokens(funcionario, familia) {
  const accessToken = jwt.sign(
    { id: funcionario.id, cargo: funcionario.cargo },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" },
  );
  const { exp, iat } = jwt.decode(accessToken);

  const refreshToken = crypto.randomBytes(48).toString("base64url");
  await refreshTokenRepository.criar({
    id_funcionario: funcionario.id,
    familia,
    token_hash: hashToken(refreshToken),
    dias: diasRefresh(),
  });

  return {
    accessToken,
    refreshToken,
    token: accessToken, // nome antigo, mantido para não quebrar o que já usa "token"
    expiresIn: exp - iat, // validade do accessToken, em segundos
  };
}

async function montarResposta(funcionario, familia) {
  return {
    ...(await emitirTokens(funcionario, familia)),
    funcionario: {
      id: funcionario.id,
      nome: funcionario.nome,
      email: funcionario.email,
      cargo: funcionario.cargo,
      temFoto: Boolean(funcionario.foto_perfil), // o front só busca a foto se ela existir
    },
    permissoes: await funcionarioRepository.findPermissoes(funcionario.id),
  };
}

/**
 * Entra por CPF (`{ cpf }`, só os 11 dígitos) ou por e-mail (`{ email }`).
 * Devolve os tokens ou null se as credenciais forem inválidas.
 * A mesma resposta (null) vale para usuário inexistente e senha errada.
 */
async function login({ cpf, email }, senha) {
  const funcionario = cpf
    ? await funcionarioRepository.findByCpfWithCargo(cpf)
    : await funcionarioRepository.findByEmailWithCargo(email);
  const senhaOk =
    funcionario && (await bcrypt.compare(senha, funcionario.senha));
  if (!senhaOk) return null;

  return montarResposta(funcionario, crypto.randomUUID()); // cada login = uma sessão nova
}

/**
 * Troca um refresh token válido por um PAR NOVO (rotação).
 *  - token desconhecido ........ 401
 *  - token já usado ............ 401; fora da janela de tolerância, a sessão inteira é encerrada
 *  - token vencido ............. 401
 */
async function renovar(refreshToken) {
  const hash = hashToken(refreshToken);
  const registro = await refreshTokenRepository.findByHash(hash);
  if (!registro) throw erro(401, "Refresh token inválido");

  if (registro.revogado_em) {
    if (registro.segundos_revogado <= graceSegundos()) {
      throw erro(401, "Refresh token já utilizado");
    }
    // um token antigo voltou a aparecer: pode ter sido copiado. Derruba a sessão.
    await refreshTokenRepository.revogarFamilia(registro.familia);
    throw erro(
      401,
      "Refresh token reutilizado: sessão encerrada por segurança",
    );
  }
  if (registro.expirado) throw erro(401, "Refresh token expirado");

  // se duas requisições chegarem juntas, só uma consegue revogar e seguir
  if (!(await refreshTokenRepository.revogarSeAtivo(hash))) {
    throw erro(401, "Refresh token já utilizado");
  }

  const funcionario = await funcionarioRepository.findById(
    registro.id_funcionario,
  );
  if (!funcionario) throw erro(401, "Funcionário não encontrado");

  return montarResposta(funcionario, registro.familia);
}

/** Encerra a sessão do refresh token informado. Não revela se ele existia. */
async function logout(refreshToken) {
  const registro = await refreshTokenRepository.findByHash(
    hashToken(refreshToken),
  );
  if (registro) await refreshTokenRepository.revogarFamilia(registro.familia);
}

/** "Sair de todos os dispositivos". Devolve quantos tokens foram revogados. */
async function logoutTodos(idFuncionario) {
  return refreshTokenRepository.revogarTodosDoFuncionario(idFuncionario);
}

const limparTokensExpirados = () => refreshTokenRepository.limparExpirados();

/** Limpeza ao ligar o servidor e a cada 24 h. */
function iniciarLimpeza() {
  const limpar = () =>
    limparTokensExpirados().catch((e) =>
      console.error("Falha ao limpar refresh tokens:", e.message),
    );
  limpar();
  const intervalo = setInterval(limpar, 24 * 60 * 60 * 1000);
  if (intervalo.unref) intervalo.unref();
}

module.exports = {
  login,
  renovar,
  logout,
  logoutTodos,
  limparTokensExpirados,
  iniciarLimpeza,
};
