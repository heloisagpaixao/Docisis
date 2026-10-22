const router = require("express").Router();
const autenticar = require("../middlewares/auth");
const asyncHandler = require("../utils/asyncHandler");
const authController = require("../controllers/auth.controller");

router.post("/login", asyncHandler(authController.login));

// Públicas de propósito: quem renova ou sai pode estar com o accessToken já vencido
router.post("/refresh-token", asyncHandler(authController.refreshToken));
router.post("/logout", asyncHandler(authController.logout));

// "Sair de todos os dispositivos": exige estar logado
router.post("/logout-todos", autenticar, asyncHandler(authController.logoutTodos));

module.exports = router;
