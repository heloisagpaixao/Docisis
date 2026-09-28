const express = require("express");
const router = express.Router();
const ProdutoController = require("../controllers/ProdutoController");
const authMiddleware = require("../middlewares/AuthMiddleware");
const permissaoMiddleware = require("../middlewares/PermissaoMiddleware");
const upload = require("../config/ProdutoMulter");


// Autenticação obrigatória para produtos
router.use(authMiddleware);

// Leitura
router.get("/", ProdutoController.listar);
router.get("/:id", ProdutoController.buscarPorId);

// Escrita exige cargo com permissão
router.post("/", permissaoMiddleware, upload.single("imagem"), ProdutoController.cadastrar);
router.put("/:id", permissaoMiddleware, upload.single("imagem"), ProdutoController.atualizar);
router.delete("/:id", permissaoMiddleware, ProdutoController.deletar);

module.exports = router;

