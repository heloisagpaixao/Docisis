const router = require("express").Router();
const autenticar = require("../middlewares/auth");
const exigirPermissao = require("../middlewares/permissao");
const c = require("../controllers/produtos.controller");

router.use(autenticar);

// Consultar: todos os cargos têm ESTOQUE_CONSULTAR
router.get("/", exigirPermissao("ESTOQUE_CONSULTAR"), c.listar);
router.get("/:id", exigirPermissao("ESTOQUE_CONSULTAR"), c.buscar);

// Alterar: só quem gerencia produtos
router.post("/", exigirPermissao("PRODUTO_GERENCIAR"), c.criar);
router.put("/:id", exigirPermissao("PRODUTO_GERENCIAR"), c.atualizar);
router.delete("/:id", exigirPermissao("PRODUTO_GERENCIAR"), c.excluir);

module.exports = router;
