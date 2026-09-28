const express = require("express");
const router = express.Router();
const NotaFiscalController = require("../controllers/NotaFiscalController");
const authMiddleware = require("../middlewares/AuthMiddleware");
const permissaoMiddleware = require("../middlewares/PermissaoMiddleware");
const upload = require("../config/NotaFiscalMulter");


// Autenticação obrigatória para notas fiscais
router.use(authMiddleware);

// Leitura
router.get("/", NotaFiscalController.listar);
router.get("/:id", NotaFiscalController.buscarPorId);

// Escrita exige permissão
router.post("/", permissaoMiddleware, upload.single("arquivo"), NotaFiscalController.cadastrar);
router.put("/:id", permissaoMiddleware, upload.single("arquivo"), NotaFiscalController.atualizar);
router.delete("/:id", permissaoMiddleware, NotaFiscalController.deletar);

module.exports = router;

