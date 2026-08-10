const express = require('express');
const router = express.Router();

const FuncionariosRoutes = require('./FuncionariosRoutes');

// Rota base (Root endpoint que estava em app.js)
router.get('/', (req, res) => {
    res.json({
        mensagem: "API Docisis funcionando! 🧁",
        versao: "1.0.0",
        arquitetura: "MVC + SOLID"
    });
});

// Registrar domínios de rotas
router.use('/funcionarios', FuncionariosRoutes);

module.exports = router;
