const express = require('express');
const router = express.Router();

const cargoRoutes = require('./cargoRoutes');
const funcionarioRoutes = require('./funcionarioRoutes');
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
router.use('/cargos', cargoRoutes);
router.use('/funcionarios', funcionarioRoutes);
router.use('/produtos', produtoRoutes);
router.use('/lotes', loteRoutes);
router.use('/notas-fiscais', notaFiscalRoutes);
router.use('/entradas', entradaRoutes);
router.use('/saidas', saidaRoutes);
router.use('/estoque', estoqueRoutes);

module.exports = router;
