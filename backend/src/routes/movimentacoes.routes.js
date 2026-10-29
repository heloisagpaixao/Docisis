const router = require("express").Router();
const autenticar = require("../middlewares/auth");
const exigirPermissao = require("../middlewares/permissao");
const asyncHandler = require("../utils/asyncHandler");
const c = require("../controllers/movimentacoes.controller");

router.use(autenticar, exigirPermissao("ESTOQUE_CONSULTAR"));
router.get("/", asyncHandler(c.listar));

module.exports = router;
