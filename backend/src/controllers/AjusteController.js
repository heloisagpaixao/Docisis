const ajusteService = require("../services/AjusteService");

class AjusteController {
  async criar(req, res) {
    try {
      const { id_lote, quantidade_nova, motivo } = req.body;
      const id_funcionario = req.body.id_funcionario || req.user?.id || req.funcionario?.id;

      const ajuste = await ajusteService.criarAjuste({
        id_lote,
        id_funcionario,
        quantidade_nova,
        motivo,
      });

      return res.status(201).json({
        sucesso: true,
        mensagem: "Ajuste de estoque realizado com sucesso.",
        dados: ajuste,
      });
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({
        sucesso: false,
        mensagem: error.mensagem || error.message || "Erro interno ao processar o ajuste de estoque.",
        erro: error.mensagem || error.message || "Erro interno",
      });
    }
  }

  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const ajuste = await ajusteService.buscarPorId(id);
      return res.status(200).json({ sucesso: true, dados: ajuste });
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({
        sucesso: false,
        mensagem: error.mensagem || error.message || "Erro ao buscar o ajuste.",
        erro: error.mensagem || error.message,
      });
    }
  }

  async listar(req, res) {
    try {
      const ajustes = await ajusteService.listarAjustes(req.query);
      return res.status(200).json(ajustes);
    } catch (error) {
      return res.status(error.status || 500).json({
        sucesso: false,
        mensagem: error.mensagem || error.message || "Erro interno ao buscar o histórico de ajustes.",
        erro: error.mensagem || error.message,
      });
    }
  }
}

module.exports = new AjusteController();
