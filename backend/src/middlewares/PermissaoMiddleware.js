// Uso: permissaoMiddleware('cadastrar'), permissaoMiddleware('excluir'), etc.
// Assume que authMiddleware já rodou antes e preencheu req.user.
// Assume permissoes salvas como string separada por vírgula, ex: "cadastrar,editar,excluir".
// Se no banco de vocês o formato for outro (JSON, nível numérico, etc.), só trocar
// a forma como `permissoesDoUsuario` é montado abaixo.

function verificarPermissao(req, res, next, permissaoNecessaria) {
  const usuario = req.user || req.funcionario;

  if (!usuario) {
    return res.status(401).json({
      sucesso: false,
      mensagem: "Usuário não autenticado.",
      erro: "Não autenticado",
    });
  }

  const permissoes = usuario.permissoes;

  // 1. Se permissoes no banco for booleano/numérico (ex: 1/true = acesso total/admin, 0/false = sem permissão)
  if (typeof permissoes === "boolean" || typeof permissoes === "number") {
    const temPermissao = Boolean(permissoes);
    if (!temPermissao) {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Seu cargo não possui permissão para executar esta ação.",
        erro: "Acesso negado",
      });
    }
    return next();
  }

  // 2. Se permissoes for uma string (ex: "true", "false" ou "cadastrar,editar,excluir")
  if (typeof permissoes === "string") {
    const permString = permissoes.trim().toLowerCase();
    if (permString === "true" || permString === "1") {
      return next();
    }
    if (permString === "false" || permString === "0" || permString === "") {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Seu cargo não possui permissão para executar esta ação.",
        erro: "Acesso negado",
      });
    }

    if (permissaoNecessaria) {
      const listaPermissoes = permString.split(",").map((p) => p.trim());
      if (!listaPermissoes.includes(permissaoNecessaria.toLowerCase())) {
        return res.status(403).json({
          sucesso: false,
          mensagem: `Permissão '${permissaoNecessaria}' necessária para executar esta ação.`,
          erro: "Acesso negado",
        });
      }
    }

    return next();
  }

  // Caso não tenha permissões definidas
  return res.status(403).json({
    sucesso: false,
    mensagem: "Você não tem permissão para executar esta ação.",
    erro: "Acesso negado",
  });
}

function permissaoMiddleware(arg1, arg2, arg3) {
  // Se chamado diretamente pelo Express: permissaoMiddleware(req, res, next)
  if (typeof arg3 === "function" && arg2 && (typeof arg2.status === "function" || typeof arg2.send === "function")) {
    return verificarPermissao(arg1, arg2, arg3);
  }

  // Se chamado como fábrica de middleware: permissaoMiddleware('cadastrar')
  const permissaoNecessaria = typeof arg1 === "string" ? arg1 : null;
  return (req, res, next) => {
    return verificarPermissao(req, res, next, permissaoNecessaria);
  };
}


module.exports = permissaoMiddleware;

