const { Router } = require('express');
const CargosController = require('../controllers/CargoController');

const cargosRoutes = Router();

cargosRoutes.get('/', CargosController.listarCargos); 
cargosRoutes.get('/:id', CargosController.buscarCargosPorId); 
cargosRoutes.post('/', CargosController.cadastrarCargos); 
cargosRoutes.put('/:id', CargosController.atualizarCargos); 
cargosRoutes.delete('/:id', CargosController.deletarCargos); 

module.exports = cargosRoutes;