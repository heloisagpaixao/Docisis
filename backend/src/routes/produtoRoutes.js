const express = require("express");
const router = express.Router();
const ProdutoController = require("../controllers/ProdutoController");
const uploadProduto = require("../config/ProdutoMulter");

router.get("/", ProdutoController.listar);
router.get("/:id", ProdutoController.buscarPorId);
router.post("/", uploadProduto.single("imagem"), ProdutoController.cadastrar);
router.put("/:id", uploadProduto.single("imagem"), ProdutoController.atualizar);
router.delete("/:id", ProdutoController.deletar);

module.exports = router;
