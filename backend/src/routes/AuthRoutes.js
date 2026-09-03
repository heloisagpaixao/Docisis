const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");
const FuncionarioController = require("../controllers/FuncionarioController");
const upload = require("../config/multer");

// Rotas PÚBLICAS (sem middleware de autenticação)
router.post("/login", AuthController.login);
router.post("/cadastrar", upload.single("foto_perfil"), FuncionarioController.cadastrar);

module.exports = router;
