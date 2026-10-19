const FuncionarioService = require("../services/FuncionarioService");

class FuncionarioController {
  async listar(req, res) {
    try {
      const resultado = await FuncionarioService.listarFuncionarios(req.query);
      res.json(resultado);
    } catch (erro) {
      res.status(erro.status || 500).json({
        sucesso: false,
        mensagem: erro.mensagem || erro.message || "Erro interno do servidor",
        erro: erro.mensagem || erro.message,
      });
    }
  }

  async buscarPorId(req, res) {
    try {
      const resultado = await FuncionarioService.buscarFuncionarioPorId(
        req.params.id,
      );
      res.json(resultado);
    } catch (erro) {
      res.status(erro.status || 500).json({
        sucesso: false,
        mensagem: erro.mensagem || erro.message || "Erro interno do servidor",
        erro: erro.mensagem || erro.message,
      });
    }
  }

  async cadastrar(req, res) {
    try {
      const resultado = await FuncionarioService.cadastrarFuncionario({
        ...req.body,
        file: req.file,
      });
      return res.status(201).json(resultado);
    } catch (error) {
      return res.status(error.status || 500).json({
        sucesso: false,
        mensagem: error.mensagem || error.message || "Erro interno do servidor",
        erro: error.mensagem || error.message,
      });
    }
  }

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const resultado = await FuncionarioService.atualizarFuncionario(id, {
        ...req.body,
        file: req.file,
      });
      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(error.status || 500).json({
        sucesso: false,
        mensagem: error.mensagem || error.message || "Erro interno do servidor",
        erro: error.mensagem || error.message,
      });
    }
  }

  async deletar(req, res) {
    try {
      const resultado = await FuncionarioService.deletarFuncionario(
        req.params.id,
      );
      res.json(resultado);
    } catch (erro) {
      res.status(erro.status || 500).json({
        sucesso: false,
        mensagem: erro.mensagem || erro.message || "Erro interno do servidor",
        erro: erro.mensagem || erro.message,
      });
    }
  }

  async alterarSenha(req, res) {
    try {
      const { id } = req.params;
      const resultado = await FuncionarioService.alterarSenha(id, req.body);
      res.json(resultado);
    } catch (erro) {
      res.status(erro.status || 500).json({
        sucesso: false,
        mensagem: erro.mensagem || erro.message || "Erro interno do servidor",
        erro: erro.mensagem || erro.message,
      });
    }
  }
}

module.exports = new FuncionarioController();
