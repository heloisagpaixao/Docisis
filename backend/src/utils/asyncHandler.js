/** Garante que erros de funções async cheguem ao errorHandler. */
module.exports = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
