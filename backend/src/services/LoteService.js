const LoteRepository = require('../repositories/LoteRepository');

class LoteService {
    async listarLotes() {
        const lotes = await LoteRepository.findAll();
        return {
            sucesso: true,
            dados: lotes,
            total: lotes.length
        };
    }

    async buscarLotePorId(id) {
        if (!id || isNaN(id)) {
            throw { status: 400, mensagem: "ID inválido" };
        }

        const lote = await LoteRepository.findById(id);
        if (!lote) {
            throw { status: 404, mensagem: "Lote não encontrado" };
        }

        return {
            sucesso: true,
            dados: lote
        };
    }

    async cadastrarLote(dados) {
        const { quantidade, materia_prima, dt_validade, id_nota } = dados;

        if (!quantidade || !materia_prima || !dt_validade) {
            throw { status: 400, mensagem: "Os campos quantidade, materia_prima e dt_validade são obrigatórios" };
        }

        if (!id_nota) {
            throw { status: 400, mensagem: "O campo 'id_nota' é obrigatório" };
        }

        const novoLote = {
            quantidade: Number(quantidade),
            materia_prima: materia_prima.trim(),
            dt_validade,
            id_nota: Number(id_nota)
        };

        const id = await LoteRepository.create(novoLote);

        return {
            sucesso: true,
            mensagem: "Lote cadastrado com sucesso",
            id
        };
    }

    async atualizarLote(id, dados) {
        if (!id || isNaN(id)) {
            throw { status: 400, mensagem: "ID inválido" };
        }

        const existe = await LoteRepository.findById(id);
        if (!existe) {
            throw { status: 404, mensagem: "Lote não encontrado" };
        }

        const atualizado = {};

        if (dados.quantidade !== undefined) atualizado.quantidade = Number(dados.quantidade);
        if (dados.materia_prima !== undefined) atualizado.materia_prima = dados.materia_prima.trim();
        if (dados.dt_validade !== undefined) atualizado.dt_validade = dados.dt_validade;
        if (dados.id_nota !== undefined) atualizado.id_nota = Number(dados.id_nota);

        if (Object.keys(atualizado).length === 0) {
            throw { status: 400, mensagem: "Nenhum dado válido enviado para atualização" };
        }

        await LoteRepository.update(id, atualizado);

        return {
            sucesso: true,
            mensagem: "Lote atualizado com sucesso"
        };
    }

    async deletarLote(id) {
        if (!id || isNaN(id)) {
            throw { status: 400, mensagem: "ID inválido" };
        }

        const existe = await LoteRepository.findById(id);
        if (!existe) {
            throw { status: 404, mensagem: "Lote não encontrado" };
        }

        await LoteRepository.delete(id);

        return {
            sucesso: true,
            mensagem: "Lote apagado com sucesso"
        };
    }
}

module.exports = new LoteService();
