const router = require("express").Router();
const autenticar = require("../middlewares/auth");
const exigirPermissao = require("../middlewares/permissao");
const asyncHandler = require("../utils/asyncHandler");
const c = require("../controllers/ajustes.controller");

router.use(autenticar);

// Ajustes mexem direto no saldo: tanto ver quanto registrar exigem AJUSTE_REGISTRAR.
// Não existe PUT nem DELETE de propósito: o ajuste é um registro de auditoria.
router.get("/", exigirPermissao("AJUSTE_REGISTRAR"), asyncHandler(c.listar));
router.get("/:id", exigirPermissao("AJUSTE_REGISTRAR"), asyncHandler(c.buscar));
router.post("/", exigirPermissao("AJUSTE_REGISTRAR"), asyncHandler(c.criar));

module.exports = router;
