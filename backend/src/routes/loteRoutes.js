const express = require('express');
const router = express.Router();
const LoteController = require('../controllers/LoteController');

router.get('/', LoteController.listar);
router.get('/:id', LoteController.buscarPorId);
router.get('/vencendo', LoteController.buscarVencendo);
router.post('/', LoteController.cadastrar);
router.put('/:id', LoteController.atualizar);
router.delete('/:id', LoteController.deletar);

module.exports = router;
