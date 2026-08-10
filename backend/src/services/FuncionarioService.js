const FuncionarioRepository = require('../repositories/FuncionarioRepository');
const CargoRepository = require('../repositories/CargoRepository');

class FuncionarioService {
    async listarFuncionarios() {
        const funcionarios = await FuncionarioRepository.findAll();
        return {
            sucesso: true,
            dados: funcionarios,
            total: funcionarios.length
        };
    }

    async buscarFuncionarioPorId(id) {
        if (!id || isNaN(id)) {
            throw { status: 400, mensagem: "ID inválido" };
        }

        const funcionario = await FuncionarioRepository.findById(id);
        if (!funcionario) {
            throw { status: 404, mensagem: "Funcionário não encontrado" };
        }

        return {
            sucesso: true,
            dados: funcionario
        };
    }

    async cadastrarFuncionario(dados) {
        const { nome, cpf, email, telefone, id_cargo } = dados;

        if (!nome || !cpf || !email || !telefone) {
            throw { status: 400, mensagem: "Os campos nome, cpf, email e telefone são obrigatórios" };
        }

        if (!id_cargo) {
            throw { status: 400, mensagem: "O campo 'id_cargo' é obrigatório" };
        }

        // Verifica se o cargo existe
        const cargoExiste = await CargoRepository.findById(id_cargo);
        if (!cargoExiste) {
            throw { status: 404, mensagem: `Cargo com ID ${id_cargo} não encontrado` };
        }

        // Verifica unicidade do CPF
        const cpfExistente = await FuncionarioRepository.findByCpf(cpf);
        if (cpfExistente) {
            throw { status: 400, mensagem: "Já existe um funcionário com este CPF" };
        }

        // Verifica unicidade do email
        const emailExistente = await FuncionarioRepository.findByEmail(email);
        if (emailExistente) {
            throw { status: 400, mensagem: "Já existe um funcionário com este email" };
        }

        const novoFuncionario = {
            nome: nome.trim(),
            cpf: cpf.trim(),
            email: email.trim(),
            telefone: telefone.trim(),
            id_cargo
        };

        const id = await FuncionarioRepository.create(novoFuncionario);

        return {
            sucesso: true,
            mensagem: "Funcionário cadastrado com sucesso",
            id
        };
    }

    async atualizarFuncionario(id, dados) {
        if (!id || isNaN(id)) {
            throw { status: 400, mensagem: "ID inválido" };
        }

        const existe = await FuncionarioRepository.findById(id);
        if (!existe) {
            throw { status: 404, mensagem: "Funcionário não encontrado" };
        }

        const atualizado = {};

        if (dados.nome !== undefined) atualizado.nome = dados.nome.trim();
        if (dados.telefone !== undefined) atualizado.telefone = dados.telefone.trim();

        if (dados.cpf !== undefined) {
            const cpfExistente = await FuncionarioRepository.findByCpf(dados.cpf);
            if (cpfExistente && cpfExistente.id !== Number(id)) {
                throw { status: 400, mensagem: "Já existe um funcionário com este CPF" };
            }
            atualizado.cpf = dados.cpf.trim();
        }

        if (dados.email !== undefined) {
            const emailExistente = await FuncionarioRepository.findByEmail(dados.email);
            if (emailExistente && emailExistente.id !== Number(id)) {
                throw { status: 400, mensagem: "Já existe um funcionário com este email" };
            }
            atualizado.email = dados.email.trim();
        }

        if (dados.id_cargo !== undefined) {
            const cargoExiste = await CargoRepository.findById(dados.id_cargo);
            if (!cargoExiste) {
                throw { status: 404, mensagem: `Cargo com ID ${dados.id_cargo} não encontrado` };
            }
            atualizado.id_cargo = dados.id_cargo;
        }

        if (Object.keys(atualizado).length === 0) {
            throw { status: 400, mensagem: "Nenhum dado válido enviado para atualização" };
        }

        await FuncionarioRepository.update(id, atualizado);

        return {
            sucesso: true,
            mensagem: "Funcionário atualizado com sucesso"
        };
    }

    async deletarFuncionario(id) {
        if (!id || isNaN(id)) {
            throw { status: 400, mensagem: "ID inválido" };
        }

        const existe = await FuncionarioRepository.findById(id);
        if (!existe) {
            throw { status: 404, mensagem: "Funcionário não encontrado" };
        }

        await FuncionarioRepository.delete(id);

        return {
            sucesso: true,
            mensagem: "Funcionário apagado com sucesso"
        };
    }
}

module.exports = new FuncionarioService();
