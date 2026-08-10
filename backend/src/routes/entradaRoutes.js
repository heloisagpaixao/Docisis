const express = require('express');
const router = express.Router();
const EntradaController = require('../controllers/EntradaController');

router.get('/', EntradaController.listar);
router.get('/:id', EntradaController.buscarPorId);
router.post('/', EntradaController.cadastrar);
router.put('/:id', EntradaController.atualizar);
router.delete('/:id', EntradaController.deletar);

module.exports = router;
