const express = require('express');
const router = express.Router();
const EstoqueController = require('../controllers/EstoqueController');

router.get('/', EstoqueController.listar);
router.get('/:id', EstoqueController.buscarPorId);

module.exports = router;
