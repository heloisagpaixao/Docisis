const router = require("express").Router();
const autenticar = require("../middlewares/auth");
const exigirPermissao = require("../middlewares/permissao");
const asyncHandler = require("../utils/asyncHandler");
const c = require("../controllers/notasfiscais.controller");

router.use(autenticar);

router.get("/", exigirPermissao("ESTOQUE_CONSULTAR"), asyncHandler(c.listar));
router.get(
  "/:id",
  exigirPermissao("ESTOQUE_CONSULTAR"),
  asyncHandler(c.buscar),
);

router.post(
  "/",
  exigirPermissao("NOTA_FISCAL_REGISTRAR"),
  asyncHandler(c.criar),
);
router.put(
  "/:id",
  exigirPermissao("NOTA_FISCAL_REGISTRAR"),
  asyncHandler(c.atualizar),
);
router.delete(
  "/:id",
  exigirPermissao("NOTA_FISCAL_REGISTRAR"),
  asyncHandler(c.excluir),
);

module.exports = router;
