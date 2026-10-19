const express = require("express");
const router = express.Router();
const upload = require("../config/FuncionarioMulter");
const FuncionarioController = require("../controllers/FuncionarioController");
const authMiddleware = require("../middlewares/AuthMiddleware");
const permissaoMiddleware = require("../middlewares/PermissaoMiddleware");

// Autoproteção: autenticação obrigatória para todas as rotas de funcionários
router.use(authMiddleware);

router.get("/", FuncionarioController.listar);
router.get("/:id", FuncionarioController.buscarPorId);
router.post(
  "/",
  permissaoMiddleware,
  upload.single("foto_perfil"),
  FuncionarioController.cadastrar,
);
router.put(
  "/:id",
  permissaoMiddleware,
  upload.single("foto_perfil"),
  FuncionarioController.atualizar,
);
router.patch(
  "/:id/senha",
  permissaoMiddleware,
  FuncionarioController.alterarSenha,
);
router.delete("/:id", permissaoMiddleware, FuncionarioController.deletar);

module.exports = router;
