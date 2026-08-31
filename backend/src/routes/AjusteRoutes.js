const express = require("express");
const router = express.Router();
const ajusteController = require("../controllers/AjusteController");

router.post("/ajustes", (req, res) => ajusteController.criar(req, res));
router.get("/ajustes", (req, res) => ajusteController.listar(req, res));
router.get("/ajustes/:id", (req, res) =>
  ajusteController.buscarPorId(req, res),
);

module.exports = router;
