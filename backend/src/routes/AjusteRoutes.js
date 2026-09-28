const express = require("express");
const router = express.Router();
const ajusteController = require("../controllers/AjusteController");
const authMiddleware = require("../middlewares/AuthMiddleware");
const permissaoMiddleware = require("../middlewares/PermissaoMiddleware");


// Autenticação obrigatória
router.use(authMiddleware);

// Rotas padrão /ajustes
router.post("/", permissaoMiddleware, (req, res) => ajusteController.criar(req, res));
router.get("/", (req, res) => ajusteController.listar(req, res));
router.get("/:id", (req, res) => ajusteController.buscarPorId(req, res));

// Alias para retrocompatibilidade (/ajustes/ajustes)
router.post("/ajustes", permissaoMiddleware, (req, res) => ajusteController.criar(req, res));
router.get("/ajustes", (req, res) => ajusteController.listar(req, res));
router.get("/ajustes/:id", (req, res) => ajusteController.buscarPorId(req, res));

module.exports = router;

