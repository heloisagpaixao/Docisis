const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const FuncionariosController = require("../controllers/FuncionariosController");
const permissaoMiddleware = require("../middlewares/permissao");

router.get("/", FuncionariosController.listar);
router.get("/:id", FuncionariosController.buscarPorId);
router.post(
  "/",
  permissaoMiddleware,
  upload.single("foto_perfil"),
  FuncionariosController.cadastrar,
);
router.put(
  "/:id",
  permissaoMiddleware,
  upload.single("foto_perfil"),
  FuncionariosController.atualizar,
);
router.delete("/:id", permissaoMiddleware, FuncionariosController.deletar);

module.exports = router;
