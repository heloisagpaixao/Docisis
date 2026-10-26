const router = require("express").Router();
const autenticar = require("../middlewares/auth");
const exigirPermissao = require("../middlewares/permissao");
const asyncHandler = require("../utils/asyncHandler");
const c = require("../controllers/cargos.controller");

router.use(autenticar);

// "/permissoes" vem ANTES de "/:id", senão o Express trataria "permissoes" como um id
router.get(
  "/permissoes",
  exigirPermissao("CARGO_GERENCIAR"),
  asyncHandler(c.catalogo),
);
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
router.post("/", exigirPermissao("CARGO_GERENCIAR"), asyncHandler(c.criar));
router.put(
  "/:id",
  exigirPermissao("CARGO_GERENCIAR"),
  asyncHandler(c.atualizar),
);
router.delete(
  "/:id",
  exigirPermissao("CARGO_GERENCIAR"),
  asyncHandler(c.excluir),
);

module.exports = router;
