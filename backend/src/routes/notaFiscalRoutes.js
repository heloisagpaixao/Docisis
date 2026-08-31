const express = require("express");
const router = express.Router();
const NotaFiscalController = require("../controllers/NotaFiscalController");
const uploadNotaFiscal = require("../config/NotaFiscalMulter");

router.get("/", NotaFiscalController.listar);
router.get("/:id", NotaFiscalController.buscarPorId);
router.post(
  "/",
  uploadNotaFiscal.single("arquivo"),
  NotaFiscalController.cadastrar,
);
router.put(
  "/:id",
  uploadNotaFiscal.single("arquivo"),
  NotaFiscalController.atualizar,
);
router.delete("/:id", NotaFiscalController.deletar);

module.exports = router;
