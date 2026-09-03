// Uso: permissaoMiddleware('cadastrar'), permissaoMiddleware('excluir'), etc.
// Assume que authMiddleware já rodou antes e preencheu req.user.
// Assume permissoes salvas como string separada por vírgula, ex: "cadastrar,editar,excluir".
// Se no banco de vocês o formato for outro (JSON, nível numérico, etc.), só trocar
// a forma como `permissoesDoUsuario` é montado abaixo.

function permissaoMiddleware(permissaoNecessaria) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ erro: "Não autenticado" });
    }

    const permissoesDoUsuario = (req.user.permissoes || "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    if (!permissoesDoUsuario.includes(permissaoNecessaria)) {
      return res
        .status(403)
        .json({ erro: "Você não tem permissão para executar esta ação" });
    }

    return next();
  };
}

module.exports = permissaoMiddleware;
