const CargoRepository = require('../repositories/CargoRepository');

class CargoService {
    async listarCargos() {
        const cargos = await CargoRepository.findAll();
        return {
            sucesso: true,
            dados: cargos,
            total: cargos.length
        };
    }

    async buscarCargoPorId(id) {
        if (!id || isNaN(id)) {
            throw { status: 400, mensagem: "ID inválido" };
        }

        const cargo = await CargoRepository.findById(id);
        if (!cargo) {
            throw { status: 404, mensagem: "Cargo não encontrado" };
        }

        return {
            sucesso: true,
            dados: cargo
        };
    }

    async cadastrarCargo(dados) {
        const { permissoes, id_funcionario } = dados;

        if (permissoes === undefined || permissoes === null) {
            throw { status: 400, mensagem: "O campo 'permissoes' é obrigatório" };
        }

        if (!id_funcionario) {
            throw { status: 400, mensagem: "O campo 'id_funcionario' é obrigatório" };
        }

        const novoCargo = {
            permissoes: Boolean(permissoes),
            id_funcionario
        };

        const id = await CargoRepository.create(novoCargo);

        return {
            sucesso: true,
            mensagem: "Cargo cadastrado com sucesso",
            id
        };
    }

    async atualizarCargo(id, dados) {
        if (!id || isNaN(id)) {
            throw { status: 400, mensagem: "ID inválido" };
        }

        const existe = await CargoRepository.findById(id);
        if (!existe) {
            throw { status: 404, mensagem: "Cargo não encontrado" };
        }

        const atualizado = {};
        if (dados.permissoes !== undefined) atualizado.permissoes = Boolean(dados.permissoes);
        if (dados.id_funcionario !== undefined) atualizado.id_funcionario = dados.id_funcionario;

        if (Object.keys(atualizado).length === 0) {
            throw { status: 400, mensagem: "Nenhum dado válido enviado para atualização" };
        }

        await CargoRepository.update(id, atualizado);

        return {
            sucesso: true,
            mensagem: "Cargo atualizado com sucesso"
        };
    }

    async deletarCargo(id) {
        if (!id || isNaN(id)) {
            throw { status: 400, mensagem: "ID inválido" };
        }

        const existe = await CargoRepository.findById(id);
        if (!existe) {
            throw { status: 404, mensagem: "Cargo não encontrado" };
        }

        await CargoRepository.delete(id);

        return {
            sucesso: true,
            mensagem: "Cargo apagado com sucesso"
        };
    }
}

module.exports = new CargoService();
