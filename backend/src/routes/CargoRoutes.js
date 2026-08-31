const { Router } = require('express');
const CargosController = require('../controllers/CargoController');
const permissaoMiddleware = require('../middlewares/permissao')

const cargosRoutes = Router();

cargosRoutes.get('/', CargosController.listarCargos); 
cargosRoutes.get('/:id', CargosController.buscarCargosPorId); 
cargosRoutes.post('/', permissaoMiddleware, CargosController.cadastrarCargos); 
cargosRoutes.put('/:id', permissaoMiddleware, CargosController.atualizarCargos); 
cargosRoutes.delete('/:id', permissaoMiddleware, CargosController.deletarCargos); 

module.exports = cargosRoutes;