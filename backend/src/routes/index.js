const express = require("express");
const router = express.Router();

const AjustesRoutes = require("./AjusteRoutes");
const AuthsRoutes = require("./AuthRoutes");
const CargosRoutes = require("./CargoRoutes");
const EntradasRoutes = require("./EntradaRoutes");
const EstoqueRoutes = require("./EstoqueRoutes");
const FuncionariosRoutes = require("./FuncionarioRoutes");
const LotesRoutes = require("./LoteRoutes");
const NotasFiscaisRoutes = require("./NotaFiscalRoutes");
const ProdutosRoutes = require("./ProdutoRoutes");
const SaidasRoutes = require("./SaidaRoutes");

const AuthMiddleware = require("../middlewares/AuthMiddleware");
const Auth = require("../middlewares/Auth");
const AuthPermissao = require("../middlewares/PermissaoMiddleware");
const authMiddleware = require("../middlewares/AuthMiddleware");

// Rota base (Root endpoint)
router.get("/docisis", (req, res) => {
  res.json({
    mensagem: "API Docisis funcionando 📦",
    versao: "1.0.0",
    arquitetura: "MVC + SOLID (Refatorada)",
  });
});

// Registrar domínios de rotas
router.use("/ajustes", AjustesRoutes);
router.use("/cargos", Auth, authMiddleware, CargosRoutes);
router.use("/entradas", EntradasRoutes);
router.use("/estoque", EstoqueRoutes);
router.use("/funcionarios", Auth, authMiddleware, FuncionariosRoutes);
router.use("/lotes", LotesRoutes);
router.use("/notasfiscais", NotasFiscaisRoutes);
router.use("/produtos", ProdutosRoutes);
router.use("/saidas", SaidasRoutes);

module.exports = router;
