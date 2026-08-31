const SaidaRepository = require('../repositories/SaidaRepository');
const FuncionariosRepository = require('../repositories/FuncionariosRepository');
const LoteRepository = require('../repositories/LoteRepository');

class SaidaService {
    async listarSaidas() {
        const saidas = await SaidaRepository.findAll();
        return {
            sucesso: true,
            dados: saidas,
            total: saidas.length
        };
    }

    async buscarSaidaPorId(id) {
        if (!id || isNaN(id)) {
            throw { status: 400, mensagem: "ID inválido" };
        }

        const saida = await SaidaRepository.findById(id);
        if (!saida) {
            throw { status: 404, mensagem: "Saída não encontrada" };
        }

        return {
            sucesso: true,
            dados: saida
        };
    }

    async cadastrarSaida(dados) {
        const { id_funcionario, id_lote, quantidade, motivo, dt_saida } = dados;

        if (!id_funcionario || !id_lote || !quantidade || !motivo) {
            throw { status: 400, mensagem: "Os campos id_funcionario, id_lote, quantidade e motivo são obrigatórios" };
        }

        if (Number(quantidade) <= 0) {
            throw { status: 400, mensagem: "A quantidade deve ser um número positivo" };
        }

        // Verifica se o funcionário existe
        const funcionarioExiste = await FuncionariosRepository.findById(id_funcionario);
        if (!funcionarioExiste) {
            throw { status: 404, mensagem: `Funcionário com ID ${id_funcionario} não encontrado` };
        }

        // Verifica se o lote existe
        const loteExiste = await LoteRepository.findById(id_lote);
        if (!loteExiste) {
            throw { status: 404, mensagem: `Lote com ID ${id_lote} não encontrado` };
        }

        const novaSaida = {
            dt_saida: dt_saida || new Date(),
            id_funcionario: Number(id_funcionario),
            id_lote: Number(id_lote),
            quantidade: Number(quantidade),
            motivo: motivo.trim()
        };

        // A transação no repository já valida a quantidade disponível
        const id = await SaidaRepository.create(novaSaida);

        return {
            sucesso: true,
            mensagem: "Saída registrada com sucesso",
            id
        };
    }

    async atualizarSaida(id, dados) {
        if (!id || isNaN(id)) {
            throw { status: 400, mensagem: "ID inválido" };
        }

        const existe = await SaidaRepository.findById(id);
        if (!existe) {
            throw { status: 404, mensagem: "Saída não encontrada" };
        }

        const atualizado = {};

        if (dados.id_funcionario !== undefined) {
            const funcionarioExiste = await FuncionariosRepository.findById(dados.id_funcionario);
            if (!funcionarioExiste) {
                throw { status: 404, mensagem: `Funcionário com ID ${dados.id_funcionario} não encontrado` };
            }
            atualizado.id_funcionario = Number(dados.id_funcionario);
        }

        if (dados.id_lote !== undefined) {
            const loteExiste = await LoteRepository.findById(dados.id_lote);
            if (!loteExiste) {
                throw { status: 404, mensagem: `Lote com ID ${dados.id_lote} não encontrado` };
            }
            atualizado.id_lote = Number(dados.id_lote);
        }

        if (dados.quantidade !== undefined) {
            if (Number(dados.quantidade) <= 0) {
                throw { status: 400, mensagem: "A quantidade deve ser um número positivo" };
            }
            atualizado.quantidade = Number(dados.quantidade);
        }

        if (dados.motivo !== undefined) atualizado.motivo = dados.motivo.trim();
        if (dados.dt_saida !== undefined) atualizado.dt_saida = dados.dt_saida;

        if (Object.keys(atualizado).length === 0) {
            throw { status: 400, mensagem: "Nenhum dado válido enviado para atualização" };
        }

        await SaidaRepository.update(id, atualizado);

        return {
            sucesso: true,
            mensagem: "Saída atualizada com sucesso"
        };
    }

    async deletarSaida(id) {
        if (!id || isNaN(id)) {
            throw { status: 400, mensagem: "ID inválido" };
        }

        const existe = await SaidaRepository.findById(id);
        if (!existe) {
            throw { status: 404, mensagem: "Saída não encontrada" };
        }

        await SaidaRepository.delete(id);

        return {
            sucesso: true,
            mensagem: "Saída apagada com sucesso"
        };
    }
}

module.exports = new SaidaService();
