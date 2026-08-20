module.exports = (req, res, next) => {
  if (!req.funcionario) {
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno: middleware de autenticação necessário.",
    });
  }

  // Verifica se o cargo do funcionário possui permissão (permissoes === 1 ou true no MySQL)
  if (!req.funcionario.permissoes) {
    return res.status(403).json({
      sucesso: false,
      mensagem: "Acesso negado. Você não tem permissão para realizar esta ação.",
    });
  }

  return next();
};
