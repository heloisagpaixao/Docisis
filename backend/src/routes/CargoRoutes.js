const { Router } = require("express");
const authMiddleware = require("../middlewares/auth");
const permissaoMiddleware = require("../middlewares/permissao");
const CargosController = require("../controllers/CargoController");

const cargosRoutes = Router();

// Autenticação obrigatória em todas as rotas
cargosRoutes.use(authMiddleware);

cargosRoutes.get("/", CargosController.listarCargos);
cargosRoutes.get("/:id", CargosController.buscarCargosPorId);
cargosRoutes.post("/", permissaoMiddleware, CargosController.cadastrarCargos);
cargosRoutes.put("/:id", permissaoMiddleware, CargosController.atualizarCargos);
cargosRoutes.delete("/:id", permissaoMiddleware, CargosController.deletarCargos);

module.exports = cargosRoutes;