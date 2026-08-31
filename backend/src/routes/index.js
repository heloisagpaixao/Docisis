const express = require('express');
const router = express.Router();

const CargosRoutes = require('./CargoRoutes');
const FuncionariosRoutes = require('./FuncionarioRoutes');
const produtoRoutes = require('./produtoRoutes');
const loteRoutes = require('./loteRoutes');
const notaFiscalRoutes = require('./notaFiscalRoutes');
const entradaRoutes = require('./entradaRoutes');
const saidaRoutes = require('./saidaRoutes');
const estoqueRoutes = require('./estoqueRoutes');

// Rota base (Root endpoint)
router.get('/', (req, res) => {
    res.json({
        mensagem: "API Docisis funcionando 📦",
        versao: "1.0.0",
        arquitetura: "MVC + SOLID (Refatorada)"
    });
});

// Registrar domínios de rotas
router.use('/funcionarios', FuncionariosRoutes);
router.use('/cargos', CargosRoutes);

module.exports = router;
