const router = require("express").Router();
const autenticar = require("../middlewares/auth");
const exigirPermissao = require("../middlewares/permissao");
const asyncHandler = require("../utils/asyncHandler");
const c = require("../controllers/notificacoes.controller");

router.use(autenticar, exigirPermissao("NOTIFICACAO_CONSULTAR"));

// Rotas fixas ANTES de "/:id", senão o Express trataria "resumo" etc. como um id
router.get("/resumo", asyncHandler(c.resumo));
router.post("/verificar", asyncHandler(c.verificar));
router.put("/lidas", asyncHandler(c.marcarTodasLidas));

router.get("/", asyncHandler(c.listar));
router.get("/:id", asyncHandler(c.buscar));
router.put("/:id/lida", asyncHandler(c.marcarLida));

module.exports = router;
