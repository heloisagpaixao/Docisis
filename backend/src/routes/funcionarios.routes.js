const router = require("express").Router();
const autenticar = require("../middlewares/auth");
const exigirPermissao = require("../middlewares/permissao");
const asyncHandler = require("../utils/asyncHandler");
const c = require("../controllers/funcionarios.controller");

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

module.exports = router;
