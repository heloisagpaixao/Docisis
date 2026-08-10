const EstoqueRepository = require('../repositories/EstoqueRepository');
const LoteRepository = require('../repositories/LoteRepository');

class EstoqueService {
    async listarEstoque() {
        const estoque = await EstoqueRepository.findAll();
        return {
            sucesso: true,
            dados: estoque,
            total: estoque.length
        };
    }

    async buscarEstoquePorId(id) {
        if (!id || isNaN(id)) {
            throw { status: 400, mensagem: "ID inválido" };
        }

        const item = await EstoqueRepository.findById(id);
        if (!item) {
            throw { status: 404, mensagem: "Registro de estoque não encontrado" };
        }

        return {
            sucesso: true,
            dados: item
        };
    }

    async cadastrarEstoque(dados) {
        const { id_lote } = dados;

        if (!id_lote) {
            throw { status: 400, mensagem: "O campo 'id_lote' é obrigatório" };
        }

        // Verifica se o lote existe
        const loteExiste = await LoteRepository.findById(id_lote);
        if (!loteExiste) {
            throw { status: 404, mensagem: `Lote com ID ${id_lote} não encontrado` };
        }

        // Verifica se o lote já está no estoque
        const estoqueExistente = await EstoqueRepository.findByLoteId(id_lote);
        if (estoqueExistente) {
            throw { status: 400, mensagem: `O lote ${id_lote} já está registrado no estoque` };
        }

        const novoEstoque = {
            id_lote: Number(id_lote)
        };

        const id = await EstoqueRepository.create(novoEstoque);

        return {
            sucesso: true,
            mensagem: "Registro de estoque criado com sucesso",
            id
        };
    }

    async atualizarEstoque(id, dados) {
        if (!id || isNaN(id)) {
            throw { status: 400, mensagem: "ID inválido" };
        }

        const existe = await EstoqueRepository.findById(id);
        if (!existe) {
            throw { status: 404, mensagem: "Registro de estoque não encontrado" };
        }

        const atualizado = {};

        if (dados.id_lote !== undefined) {
            const loteExiste = await LoteRepository.findById(dados.id_lote);
            if (!loteExiste) {
                throw { status: 404, mensagem: `Lote com ID ${dados.id_lote} não encontrado` };
            }

            // Verifica se o novo lote já está no estoque (evita duplicata)
            const estoqueExistente = await EstoqueRepository.findByLoteId(dados.id_lote);
            if (estoqueExistente && estoqueExistente.id_estoque !== Number(id)) {
                throw { status: 400, mensagem: `O lote ${dados.id_lote} já está registrado no estoque` };
            }

            atualizado.id_lote = Number(dados.id_lote);
        }

        if (Object.keys(atualizado).length === 0) {
            throw { status: 400, mensagem: "Nenhum dado válido enviado para atualização" };
        }

        await EstoqueRepository.update(id, atualizado);

        return {
            sucesso: true,
            mensagem: "Registro de estoque atualizado com sucesso"
        };
    }

    async deletarEstoque(id) {
        if (!id || isNaN(id)) {
            throw { status: 400, mensagem: "ID inválido" };
        }

        const existe = await EstoqueRepository.findById(id);
        if (!existe) {
            throw { status: 404, mensagem: "Registro de estoque não encontrado" };
        }

        await EstoqueRepository.delete(id);

        return {
            sucesso: true,
            mensagem: "Registro de estoque apagado com sucesso"
        };
    }
}

module.exports = new EstoqueService();
