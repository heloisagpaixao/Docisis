const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const authMiddleware = require("../middlewares/auth");
const permissaoMiddleware = require("../middlewares/permissao");
const FuncionarioController = require("../controllers/FuncionarioController");

// Todas as rotas de funcionários exigem autenticação
router.use(authMiddleware);

router.get("/", FuncionarioController.listar);
router.get("/:id", FuncionarioController.buscarPorId);

// Rotas que exigem permissão elevada (admin)
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
router.delete("/:id", permissaoMiddleware, FuncionarioController.deletar);

module.exports = router;
