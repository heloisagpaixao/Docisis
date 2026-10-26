const funcionarioRepository = require("../repositories/funcionarios.repository");

/**
 * Libera quando o funcionário logado é o DONO do recurso (:id da rota)
 * OU tem a permissão informada. Usado na foto de perfil: cada um cuida da
 * própria foto, e quem gerencia funcionários cuida de todas.
 */
module.exports = function proprioOuPermissao(nomePermissao) {
  return async (req, res, next) => {
    try {
      if (Number(req.params.id) === req.usuario.id) return next();
      const permissoes = await funcionarioRepository.findPermissoes(
        req.usuario.id,
      );
      if (permissoes.includes(nomePermissao)) return next();
      res.status(403).json({ erro: "Sem permissão para esta ação" });
    } catch (err) {
      next(err);
    }
  };
};
