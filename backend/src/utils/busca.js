/** Texto de busca livre (?busca=): opcional, no máximo 100 caracteres. */
function lerBusca(query = {}) {
  if (query.busca === undefined) return {};
  if (typeof query.busca !== "string") return { erro: "busca inválida" };
  const busca = query.busca.trim();
  if (busca.length > 100)
    return { erro: "busca deve ter no máximo 100 caracteres" };
  return busca ? { busca } : {};
}

/**
 * Escapa % e _ para que a pessoa digitar "50%" procure o texto "50%" e não "qualquer coisa".
 * Use junto com  LIKE ? ESCAPE '!'
 */
const escaparLike = (texto) => texto.replace(/[!%_]/g, (c) => `!${c}`);

module.exports = { lerBusca, escaparLike };
