const EstoqueService = require('../services/EstoqueService');

class EstoqueController {
    async listar(req, res) {
        try {
            const resultado = await EstoqueService.listarEstoque();
            res.json(resultado);
        } catch (erro) {
            res.status(erro.status || 500).json({
                sucesso: false,
                mensagem: erro.mensagem || "Erro interno do servidor",
                erro: erro.stack || erro
            });
        }
    }

    async buscarPorId(req, res) {
        try {
            const resultado = await EstoqueService.buscarEstoquePorId(req.params.id);
            res.json(resultado);
        } catch (erro) {
            res.status(erro.status || 500).json({
                sucesso: false,
                mensagem: erro.mensagem || "Erro interno do servidor",
                erro: erro.stack || erro
            });
        }
    }

    async cadastrar(req, res) {
        try {
            const resultado = await EstoqueService.cadastrarEstoque(req.body);
            res.status(201).json(resultado);
        } catch (erro) {
            res.status(erro.status || 500).json({
                sucesso: false,
                mensagem: erro.mensagem || "Erro interno do servidor",
                erro: erro.stack || erro
            });
        }
    }

    async atualizar(req, res) {
        try {
            const resultado = await EstoqueService.atualizarEstoque(req.params.id, req.body);
            res.json(resultado);
        } catch (erro) {
            res.status(erro.status || 500).json({
                sucesso: false,
                mensagem: erro.mensagem || "Erro interno do servidor",
                erro: erro.stack || erro
            });
        }
    }

    async deletar(req, res) {
        try {
            const resultado = await EstoqueService.deletarEstoque(req.params.id);
            res.json(resultado);
        } catch (erro) {
            res.status(erro.status || 500).json({
                sucesso: false,
                mensagem: erro.mensagem || "Erro interno do servidor",
                erro: erro.stack || erro
            });
        }
    }
}

module.exports = new EstoqueController();
