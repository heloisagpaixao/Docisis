const router = require("express").Router();
const autenticar = require("../middlewares/auth");
const exigirPermissao = require("../middlewares/permissao");
const asyncHandler = require("../utils/asyncHandler");
const c = require("../controllers/lotes.controller");

router.use(autenticar);

// "/vencendo" vem ANTES de "/:id", senão o Express trataria "vencendo" como um id
router.get(
  "/vencendo",
  exigirPermissao("ESTOQUE_CONSULTAR"),
  asyncHandler(c.vencendo),
);
router.get("/", exigirPermissao("ESTOQUE_CONSULTAR"), asyncHandler(c.listar));
router.get(
  "/:id",
  exigirPermissao("ESTOQUE_CONSULTAR"),
  asyncHandler(c.buscar),
);
router.get(
  "/:id/movimentacoes",
  exigirPermissao("ESTOQUE_CONSULTAR"),
  asyncHandler(c.movimentacoes),
);

router.post("/", exigirPermissao("LOTE_GERENCIAR"), asyncHandler(c.criar));
router.put(
  "/:id",
  exigirPermissao("LOTE_GERENCIAR"),
  asyncHandler(c.atualizar),
);
router.delete(
  "/:id",
  exigirPermissao("LOTE_GERENCIAR"),
  asyncHandler(c.excluir),
);

module.exports = router;
