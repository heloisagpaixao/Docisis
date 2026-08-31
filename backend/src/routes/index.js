const express = require("express");
const router = express.Router();

const ajusteRoutes = require("./AjusteRoutes");
const cargosRoutes = require("./CargoRoutes");
const entradaRoutes = require("./entradaRoutes");
const estoqueRoutes = require("./EstoqueRoutes");
const funcionariosRoutes = require("./FuncionarioRoutes");
const loteRoutes = require("./loteRoutes");
const notaFiscalRoutes = require("./notaFiscalRoutes");
const produtoRoutes = require("./produtoRoutes");
const saidaRoutes = require("./saidaRoutes");

// Rota base (Root endpoint)
router.get("/", (req, res) => {
  res.json({
    mensagem: "API Docisis funcionando 📦",
    versao: "1.0.0",
    arquitetura: "MVC + SOLID (Refatorada)",
  });
});

// Registrar domínios de rotas
router.use("/ajustes", ajusteRoutes);
router.use("/cargos", cargosRoutes);
router.use("/entradas", entradaRoutes);
router.use("/estoque", estoqueRoutes);
router.use("/funcionarios", funcionariosRoutes);
router.use("/lotes", loteRoutes);
router.use("/notasfiscais", notaFiscalRoutes);
router.use("/produtos", produtoRoutes);
router.use("/saidas", saidaRoutes);

module.exports = router;
