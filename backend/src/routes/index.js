const express = require('express');
const router = express.Router();

const CargosRoutes = require('./CargosRoutes');
const FuncionariosRoutes = require('./FuncionariosRoutes');
const AuthRoutes = require('./AuthRoutes');
const authMiddleware = require('../middlewares/auth');

// Rota base (Root endpoint)
router.get('/', (req, res) => {
    res.json({
        mensagem: "API Docisis funcionando 📦",
        versao: "1.0.0",
        arquitetura: "MVC + SOLID (Refatorada)"
    });
});

// Rotas públicas
router.use('/auth', AuthRoutes);

// Rotas protegidas (Requer login JWT)
router.use('/funcionarios', authMiddleware, FuncionariosRoutes);
router.use('/cargos', authMiddleware, CargosRoutes);

module.exports = router;
