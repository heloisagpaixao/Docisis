const { Router } = require("express");
const AuthController = require("../controllers/AuthController");
const FuncionarioController = require("../controllers/FuncionarioController");
const upload = require("../config/FuncionarioMulter");

const router = Router(); // Criado para resolver o ReferenceError

router.post("/login", AuthController.login);

module.exports = router; // Exportando o router correto
