const express = require("express");
const router = express.Router();
const ProdutoController = require("../controllers/ProdutoController");
const authMiddleware = require("../middlewares/auth");
const permissaoMiddleware = require("../middlewares/permissao");

// Leitura: apenas autenticação
router.get("/", authMiddleware, ProdutoController.listar);
router.get("/:id", authMiddleware, ProdutoController.buscarPorId);

// Escrita: autenticação + permissão
router.post("/", authMiddleware, permissaoMiddleware, ProdutoController.cadastrar);
router.put("/:id", authMiddleware, permissaoMiddleware, ProdutoController.atualizar);
router.delete("/:id", authMiddleware, permissaoMiddleware, ProdutoController.deletar);

module.exports = router;
