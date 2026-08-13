const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const FuncionariosController = require("../controllers/FuncionarioController");

router.get("/", FuncionariosController.listar);
router.get("/:id", FuncionariosController.buscarPorId);
router.post(
  "/",
  upload.single("foto_perfil"),
  FuncionariosController.cadastrar,
);
router.put(
  "/:id",
  upload.single("foto_perfil"),
  FuncionariosController.atualizar,
);
router.delete("/:id", FuncionariosController.deletar);

module.exports = router;
