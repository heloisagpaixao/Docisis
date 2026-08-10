const FuncionariosService = require("../services/FuncionariosService");

class FuncionariosController {
  async listar(req, res) {
    try {
      const resultado = await FuncionariosService.listarFuncionarios();
      res.json(resultado);
    } catch (erro) {
      res.status(erro.status || 500).json({
        sucesso: false,
        mensagem: erro.mensagem || "Erro interno do servidor",
        erro: erro.stack || erro,
      });
    }
  }

  async buscarPorId(req, res) {
    try {
      const resultado = await FuncionariosService.buscarFuncionarioPorId(
        req.params.id,
      );
      res.json(resultado);
    } catch (erro) {
      res.status(erro.status || 500).json({
        sucesso: false,
        mensagem: erro.mensagem || "Erro interno do servidor",
        erro: erro.stack || erro,
      });
    }
  }

  async cadastrar(req, res) {
    try {
      const resultado = await FuncionariosService.cadastrarFuncionario({
        ...req.body,
        file: req.file,
      });
      return res.status(201).json(resultado);
    } catch (error) {
      console.error("ERRO REAL:", error);
      return res
        .status(error.status || 500)
        .json({ mensagem: error.mensagem || "Erro interno do servidor" });
    }
  }

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const resultado = await FuncionariosService.atualizarFuncionario(id, {
        ...req.body,
        file: req.file,
      });
      return res.status(200).json(resultado);
    } catch (error) {
      console.error("ERRO NO PUT:", error);
      return res
        .status(error.status || 500)
        .json({ mensagem: error.mensagem || "Erro interno do servidor" });
    }
  }

  async deletar(req, res) {
    try {
      const resultado = await FuncionariosService.deletarFuncionario(
        req.params.id,
      );
      res.json(resultado);
    } catch (erro) {
      res.status(erro.status || 500).json({
        sucesso: false,
        mensagem: erro.mensagem || "Erro interno do servidor",
        erro: erro.stack || erro,
      });
    }
  }
}

module.exports = new FuncionariosController();
