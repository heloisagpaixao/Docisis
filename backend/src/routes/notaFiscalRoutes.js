const express = require('express');
const router = express.Router();
const NotaFiscalController = require('../controllers/NotaFiscalController');

router.get('/', NotaFiscalController.listar);
router.get('/:id', NotaFiscalController.buscarPorId);
router.post('/', NotaFiscalController.cadastrar);
router.put('/:id', NotaFiscalController.atualizar);
router.delete('/:id', NotaFiscalController.deletar);

module.exports = router;
