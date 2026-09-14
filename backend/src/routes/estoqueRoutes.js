const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/Auth");
const permissaoMiddleware = require("../middlewares/PermissaoMiddleware");
const EstoqueController = require("../controllers/EstoqueController");

// Autenticação obrigatória
router.use(authMiddleware);

router.get('/', EstoqueController.listar);
router.get('/:id', EstoqueController.buscarPorId);
router.get('/:id/estoque_baixo', EstoqueController.buscarEstoqueBaixo);

module.exports = router;
