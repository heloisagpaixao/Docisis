const express = require("express");
const router = express.Router();

// Importações com nomes corretos dos arquivos no disco
const AuthRoutes = require("./AuthRoutes");
const CargoRoutes = require("./CargoRoutes");
const FuncionarioRoutes = require("./FuncionarioRoutes");
const produtoRoutes = require("./produtoRoutes");
const loteRoutes = require("./loteRoutes");
const notaFiscalRoutes = require("./notaFiscalRoutes");
const entradaRoutes = require("./entradaRoutes");
const saidaRoutes = require("./saidaRoutes");
const estoqueRoutes = require("./estoqueRoutes");

// Rota base (Root endpoint)
router.get("/", (req, res) => {
  res.json({
    mensagem: "API Docisis funcionando 📦",
    versao: "1.0.0",
    arquitetura: "MVC + SOLID (Refatorada)",
  });
});

// Rotas PÚBLICAS (login/cadastro)
router.use("/auth", AuthRoutes);

// Rotas PROTEGIDAS (domínios de negócio)
router.use("/funcionarios", FuncionarioRoutes);
router.use("/cargos", CargoRoutes);
router.use("/produtos", produtoRoutes);
router.use("/lotes", loteRoutes);
router.use("/notas-fiscais", notaFiscalRoutes);
router.use("/entradas", entradaRoutes);
router.use("/saidas", saidaRoutes);
router.use("/estoque", estoqueRoutes);

module.exports = router;
