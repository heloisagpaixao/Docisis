const router = require("express").Router();
const autenticar = require("../middlewares/auth");
const exigirPermissao = require("../middlewares/permissao");
const asyncHandler = require("../utils/asyncHandler");
const c = require("../controllers/entradas.controller");

router.use(autenticar);

router.get("/", exigirPermissao("ESTOQUE_CONSULTAR"), asyncHandler(c.listar));
router.get(
  "/:id",
  exigirPermissao("ESTOQUE_CONSULTAR"),
  asyncHandler(c.buscar),
);

router.post("/", exigirPermissao("ENTRADA_REGISTRAR"), asyncHandler(c.criar));
router.put(
  "/:id",
  exigirPermissao("ENTRADA_REGISTRAR"),
  asyncHandler(c.atualizar),
);
// Apagar um registro de auditoria é uma correção gerencial: exige AJUSTE_REGISTRAR
router.delete(
  "/:id",
  exigirPermissao("AJUSTE_REGISTRAR"),
  asyncHandler(c.excluir),
);

module.exports = router;
