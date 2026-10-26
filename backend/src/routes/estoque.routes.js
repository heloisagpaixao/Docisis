const router = require("express").Router();
const autenticar = require("../middlewares/auth");
const exigirPermissao = require("../middlewares/permissao");
const asyncHandler = require("../utils/asyncHandler");
const c = require("../controllers/estoque.controller");

router.use(autenticar, exigirPermissao("ESTOQUE_CONSULTAR"));

// "/baixo" vem ANTES de "/:idLote", senão o Express trataria "baixo" como um id
router.get("/baixo", asyncHandler(c.baixo));
router.get("/", asyncHandler(c.listar));
router.get("/:idLote", asyncHandler(c.buscarPorLote));

module.exports = router;
