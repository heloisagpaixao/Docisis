const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const FuncionarioController = require("../controllers/FuncionarioController");
const permissaoMiddleware = require('../middlewares/permissao')

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
router.delete("/:id", permissaoMiddleware, FuncionarioController.deletar);

module.exports = router;
