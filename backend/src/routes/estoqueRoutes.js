const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const permissaoMiddleware = require("../middlewares/permissao");
const EstoqueController = require("../controllers/EstoqueController");

// Autenticação obrigatória
router.use(authMiddleware);

router.get('/', EstoqueController.listar);
router.get('/:id', EstoqueController.buscarPorId);
router.post('/', EstoqueController.cadastrar);
router.put('/:id', EstoqueController.atualizar);
router.delete('/:id', EstoqueController.deletar);

module.exports = router;
