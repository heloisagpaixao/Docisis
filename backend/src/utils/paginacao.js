/** Lê ?page= e ?limit= com valores seguros (limite máximo de 100). */
function lerPaginacao(query = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  return { page, limit };
}

module.exports = { lerPaginacao };
