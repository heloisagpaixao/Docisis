const router = require("express").Router();
const autenticar = require("../middlewares/auth");
const exigirPermissao = require("../middlewares/permissao");
const c = require("../controllers/funcionarios.controller");

router.use(autenticar); // tudo daqui exige login

router.get("/", exigirPermissao("FUNCIONARIO_GERENCIAR"), c.listar);
router.get("/:id", exigirPermissao("FUNCIONARIO_GERENCIAR"), c.buscar);
router.post("/", exigirPermissao("FUNCIONARIO_GERENCIAR"), c.criar);
router.put("/:id", exigirPermissao("FUNCIONARIO_GERENCIAR"), c.atualizar);
router.put("/:id/cargo", exigirPermissao("CARGO_GERENCIAR"), c.alterarCargo);
router.delete("/:id", exigirPermissao("FUNCIONARIO_GERENCIAR"), c.excluir);

module.exports = router;
