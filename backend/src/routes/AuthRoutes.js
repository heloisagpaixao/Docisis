const { Router } = require("express");
const AuthController = require("../controllers/AuthController");
const FuncionarioController = require("../controllers/FuncionarioController");
const upload = require("../config/multer");

router.post("/login", AuthController.login);

module.exports = authRoutes;
