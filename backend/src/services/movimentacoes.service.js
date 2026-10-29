const movimentacaoRepository = require("../repositories/movimentacoes.repository");
const funcionarioRepository = require("../repositories/funcionarios.repository");

const erro = (status, mensagem) => ({ status, mensagem });
const TODOS = ["ENTRADA", "SAIDA", "AJUSTE"];

/**
 * Histórico unificado. Ajustes mexem direto no saldo e só aparecem para quem pode
 * registrá-los (AJUSTE_REGISTRAR); para os demais, entram apenas entradas e saídas.
 */
async function listar(filtros, idUsuario) {
  const permissoes = await funcionarioRepository.findPermissoes(idUsuario);
  const podeVerAjustes = permissoes.includes("AJUSTE_REGISTRAR");

  if (filtros.tipo === "AJUSTE" && !podeVerAjustes) {
    throw erro(403, "Sem permissão para ver ajustes");
  }

  const { tipo, ...resto } = filtros;
  const tipos = tipo
    ? [tipo]
    : TODOS.filter((t) => t !== "AJUSTE" || podeVerAjustes);
  return movimentacaoRepository.findAll({ ...resto, tipos });
}

module.exports = { listar };
