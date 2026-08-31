const { Router } = require("express");
const AuthController = require("../controllers/AuthController");

const authRoutes = Router();

authRoutes.post("/login", AuthController.login);

module.exports = authRoutes;
