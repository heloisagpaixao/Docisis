const { Router } = require("express");
const CargosController = require("../controllers/CargoController");
const authMiddleware = require("../middlewares/authMiddleware");
const permissaoMiddleware = require("../middlewares/permissaoMiddleware");

const cargosRoutes = Router();

// Todas as rotas de cargos exigem estar logado
cargosRoutes.use(authMiddleware);

cargosRoutes.get("/", CargosController.listarCargos);
cargosRoutes.get("/:id", CargosController.buscarCargosPorId);
cargosRoutes.post(
  "/",
  permissaoMiddleware("cadastrar"),
  CargosController.cadastrarCargos,
);
cargosRoutes.put(
  "/:id",
  permissaoMiddleware("editar"),
  CargosController.atualizarCargos,
);
cargosRoutes.delete(
  "/:id",
  permissaoMiddleware("excluir"),
  CargosController.deletarCargos,
);

module.exports = cargosRoutes;
