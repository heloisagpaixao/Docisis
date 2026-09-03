const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const permissaoMiddleware = require("../middlewares/permissao");
const LoteController = require("../controllers/LoteController");

// Autenticação obrigatória
router.use(authMiddleware);

router.get("/", LoteController.listar);
router.get("/:id", LoteController.buscarPorId);

// Escrita exige permissão
router.post("/", permissaoMiddleware, LoteController.cadastrar);
router.put("/:id", permissaoMiddleware, LoteController.atualizar);
router.delete("/:id", permissaoMiddleware, LoteController.deletar);

module.exports = router;
