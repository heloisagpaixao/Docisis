const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const permissaoMiddleware = require("../middlewares/permissao");
const SaidaController = require("../controllers/SaidaController");

// Autenticação obrigatória
router.use(authMiddleware);

router.get("/", SaidaController.listar);
router.get("/:id", SaidaController.buscarPorId);

// Escrita exige permissão
router.post("/", permissaoMiddleware, SaidaController.cadastrar);
router.put("/:id", permissaoMiddleware, SaidaController.atualizar);
router.delete("/:id", permissaoMiddleware, SaidaController.deletar);

module.exports = router;
