const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const permissaoMiddleware = require("../middlewares/permissao");
const NotaFiscalController = require("../controllers/NotaFiscalController");

// Autenticação obrigatória
router.use(authMiddleware);

router.get("/", NotaFiscalController.listar);
router.get("/:id", NotaFiscalController.buscarPorId);

// Escrita exige permissão
router.post("/", permissaoMiddleware, NotaFiscalController.cadastrar);
router.put("/:id", permissaoMiddleware, NotaFiscalController.atualizar);
router.delete("/:id", permissaoMiddleware, NotaFiscalController.deletar);

module.exports = router;
