const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const permissaoMiddleware = require("../middlewares/permissao");
const EntradaController = require("../controllers/EntradaController");

// Autenticação obrigatória
router.use(authMiddleware);

router.get("/", EntradaController.listar);
router.get("/:id", EntradaController.buscarPorId);

// Escrita exige permissão
router.post("/", permissaoMiddleware, EntradaController.cadastrar);
router.put("/:id", permissaoMiddleware, EntradaController.atualizar);
router.delete("/:id", permissaoMiddleware, EntradaController.deletar);

module.exports = router;
