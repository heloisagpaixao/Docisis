const express = require('express');
const router = express.Router();

const CargoRoutes = require('./CargoRoutes');
const FuncionarioRoutes = require('./FuncionarioRoutes');
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
router.use('/cargos', CargoRoutes);
router.use('/entradas', entradaRoutes);
router.use('/estoque', estoqueRoutes);
router.use('/funcionarios', FuncionarioRoutes);
router.use('/lotes', loteRoutes);
router.use('/notasfiscais', notaFiscalRoutes);
router.use('/produtos', produtoRoutes);
router.use('/saidas', saidaRoutes);

module.exports = router;
