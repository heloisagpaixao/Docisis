const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/Auth");
const permissaoMiddleware = require("../middlewares/PermissaoMiddleware");
const LoteController = require("../controllers/LoteController");

// Autenticação obrigatória
router.use(authMiddleware);

router.get('/', LoteController.listar);
router.get('/:id', LoteController.buscarPorId);
router.post('/', LoteController.cadastrar);
router.put('/:id', LoteController.atualizar);
router.delete('/:id', LoteController.deletar);

module.exports = router;
