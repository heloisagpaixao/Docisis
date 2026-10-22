const express = require("express");
const router = express.Router();

const AjustesRoutes = require("./ajustes.routes");
const AuthsRoutes = require("./auth.routes");
const CargosRoutes = require("./cargos.routes");
const EntradasRoutes = require("./entradas.routes");
const EstoqueRoutes = require("./estoque.routes");
const FuncionariosRoutes = require("./funcionarios.routes");
const LotesRoutes = require("./lotes.routes");
const NotasFiscaisRoutes = require("./notasfiscais.routes");
const ProdutosRoutes = require("./produtos.routes");
const SaidasRoutes = require("./saidas.routes");

// Rota base (Root endpoint)
router.get("/docisis", (req, res) => {
  res.json({
    mensagem: "API Docisis funcionando 📦",
    versao: "1.0.0",
    arquitetura: "MVC + SOLID (Refatorada)",
  });
});

// Autenticação (disponível em /auth/login e /login)
router.use("/auth", AuthsRoutes);
router.use("/", AuthsRoutes);

// Registrar domínios de rotas (cada módulo se autoprotege com seu authMiddleware)
router.use("/ajustes", AjustesRoutes);
router.use("/cargos", CargosRoutes);
router.use("/entradas", EntradasRoutes);
router.use("/estoque", EstoqueRoutes);
router.use("/funcionarios", FuncionariosRoutes);
router.use("/lotes", LotesRoutes);
router.use("/notasfiscais", NotasFiscaisRoutes);
router.use("/produtos", ProdutosRoutes);
router.use("/saidas", SaidasRoutes);

module.exports = router;
