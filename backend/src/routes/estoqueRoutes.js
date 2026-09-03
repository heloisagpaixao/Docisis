const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const permissaoMiddleware = require("../middlewares/permissao");
const EstoqueController = require("../controllers/EstoqueController");

// Autenticação obrigatória
router.use(authMiddleware);

router.get("/", EstoqueController.listar);
router.get("/:id", EstoqueController.buscarPorId);

// Escrita exige permissão
router.post("/", permissaoMiddleware, EstoqueController.cadastrar);
router.put("/:id", permissaoMiddleware, EstoqueController.atualizar);
router.delete("/:id", permissaoMiddleware, EstoqueController.deletar);

module.exports = router;
