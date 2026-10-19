const { Router } = require("express");
const CargosController = require("../controllers/CargoController");
const authMiddleware = require("../middlewares/AuthMiddleware");
const permissaoMiddleware = require("../middlewares/PermissaoMiddleware");

const cargosRoutes = Router();

// Autoproteção: autenticação obrigatória para todas as rotas de cargos
cargosRoutes.use(authMiddleware);

cargosRoutes.get("/", CargosController.listarCargos);
cargosRoutes.get("/:id", CargosController.buscarCargosPorId);
cargosRoutes.post("/", permissaoMiddleware, CargosController.cadastrarCargos);
cargosRoutes.put("/:id", permissaoMiddleware, CargosController.atualizarCargos);
cargosRoutes.delete("/:id", permissaoMiddleware, CargosController.deletarCargos);

module.exports = cargosRoutes;
