const router = require("express").Router();
const autenticar = require("../middlewares/auth");
const exigirPermissao = require("../middlewares/permissao");
const asyncHandler = require("../utils/asyncHandler");
const c = require("../controllers/notasfiscais.controller");
const { receberDocumento } = require("../middlewares/upload");

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

// Arquivo da nota (PDF, JPEG ou PNG)
router.get(
  "/:id/arquivo",
  exigirPermissao("ESTOQUE_CONSULTAR"),
  asyncHandler(c.baixarArquivo),
);
router.put(
  "/:id/arquivo",
  exigirPermissao("NOTA_FISCAL_REGISTRAR"),
  receberDocumento("arquivo"),
  asyncHandler(c.enviarArquivo),
);
router.delete(
  "/:id/arquivo",
  exigirPermissao("NOTA_FISCAL_REGISTRAR"),
  asyncHandler(c.removerArquivo),
);

module.exports = router;
