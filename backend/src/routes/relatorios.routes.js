const router = require("express").Router();
const autenticar = require("../middlewares/auth");
const exigirPermissao = require("../middlewares/permissao");
const asyncHandler = require("../utils/asyncHandler");
const c = require("../controllers/relatorios.controller");

// Relatórios são para a supervisão: exigem RELATORIO_GERAR (Líder e Responsável do Setor)
router.use(autenticar, exigirPermissao("RELATORIO_GERAR"));

router.get("/estoque", asyncHandler(c.estoque));
router.get("/movimentacoes", asyncHandler(c.movimentacoes));
router.get("/vencimentos", asyncHandler(c.vencimentos));
router.get("/notasfiscais", asyncHandler(c.notasFiscais));

module.exports = router;
