const router = require("express").Router();
const autenticar = require("../middlewares/auth");
const exigirPermissao = require("../middlewares/permissao");
const asyncHandler = require("../utils/asyncHandler");
const c = require("../controllers/funcionarios.controller");
const { receberImagem } = require("../middlewares/upload");
const proprioOuPermissao = require("../middlewares/proprioOuPermissao");

router.use(autenticar);

router.get(
  "/",
  exigirPermissao("FUNCIONARIO_GERENCIAR"),
  asyncHandler(c.listar),
);
router.get(
  "/:id",
  exigirPermissao("FUNCIONARIO_GERENCIAR"),
  asyncHandler(c.buscar),
);
router.post(
  "/",
  exigirPermissao("FUNCIONARIO_GERENCIAR"),
  asyncHandler(c.criar),
);
router.put(
  "/:id",
  exigirPermissao("FUNCIONARIO_GERENCIAR"),
  asyncHandler(c.atualizar),
);
router.put(
  "/:id/cargo",
  exigirPermissao("CARGO_GERENCIAR"),
  asyncHandler(c.alterarCargo),
);
router.delete(
  "/:id",
  exigirPermissao("FUNCIONARIO_GERENCIAR"),
  asyncHandler(c.excluir),
);

// Foto de perfil: ver = qualquer funcionário logado; trocar/remover = o próprio dono ou quem gerencia funcionários
router.get("/:id/foto", asyncHandler(c.baixarFoto));
router.put(
  "/:id/foto",
  proprioOuPermissao("FUNCIONARIO_GERENCIAR"),
  receberImagem("foto"),
  asyncHandler(c.enviarFoto),
);
router.delete(
  "/:id/foto",
  proprioOuPermissao("FUNCIONARIO_GERENCIAR"),
  asyncHandler(c.removerFoto),
);

module.exports = router;
