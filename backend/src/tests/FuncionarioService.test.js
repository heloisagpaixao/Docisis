const bcrypt = require('bcryptjs');
const FuncionarioRepository = require('../repositories/FuncionarioRepository');
const FuncionarioService = require('../services/FuncionarioService');

jest.mock('../repositories/FuncionarioRepository');
jest.mock('bcryptjs');

describe('FuncionarioService - Testes Unitários', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('FUNC-SVC-01: Deve criptografar a senha com bcrypt.hash antes de salvar novo funcionário', async () => {
    const dadosFuncionario = {
      nome: 'Enzo Confeiteiro',
      cpf: '12345678901',
      email: 'enzo@gmail.com',
      senha: 'senhaPlana123',
      telefone: '11999998888',
      id_cargo: 2
    };

    FuncionarioRepository.findByCpf.mockResolvedValue(null);
    FuncionarioRepository.findByEmail.mockResolvedValue(null);
    bcrypt.genSalt.mockResolvedValue('salt123');
    bcrypt.hash.mockResolvedValue('hash_seguro_da_senha');
    FuncionarioRepository.create.mockResolvedValue(10);

    const resultado = await FuncionarioService.cadastrarFuncionario(dadosFuncionario);

    expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
    expect(bcrypt.hash).toHaveBeenCalledWith('senhaPlana123', 'salt123');
    expect(FuncionarioRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        senha: 'hash_seguro_da_senha',
        nome: 'Enzo Confeiteiro',
        email: 'enzo@gmail.com',
        cpf: '12345678901',
        id_cargo: 2
      })
    );
    expect(resultado).toEqual({
      sucesso: true,
      mensagem: 'Funcionário cadastrado com sucesso',
      id: 10
    });
  });

  test('FUNC-SVC-02: Deve lançar exceção se CPF já estiver cadastrado no sistema', async () => {
    const dados = {
      nome: 'Enzo',
      cpf: '12345678901',
      email: 'enzo@gmail.com',
      senha: '123',
      telefone: '11999998888',
      id_cargo: 1
    };

    FuncionarioRepository.findByCpf.mockResolvedValue({ id: 1, cpf: '12345678901' });

    await expect(FuncionarioService.cadastrarFuncionario(dados)).rejects.toEqual({
      status: 400,
      mensagem: 'Já existe um funcionário cadastrado com este CPF'
    });
    expect(FuncionarioRepository.create).not.toHaveBeenCalled();
  });

  test('FUNC-SVC-02: Deve lançar exceção se e-mail já estiver cadastrado no sistema', async () => {
    const dados = {
      nome: 'Enzo',
      cpf: '12345678901',
      email: 'enzo@gmail.com',
      senha: '123',
      telefone: '11999998888',
      id_cargo: 1
    };

    FuncionarioRepository.findByCpf.mockResolvedValue(null);
    FuncionarioRepository.findByEmail.mockResolvedValue({ id: 2, email: 'carlos@docisis.com' });

    await expect(FuncionarioService.cadastrarFuncionario(dados)).rejects.toEqual({
      status: 400,
      mensagem: 'Já existe um funcionário cadastrado com este e-mail corporativo'
    });
    expect(FuncionarioRepository.create).not.toHaveBeenCalled();
  });

  test('FUNC-SVC-03: Deve rejeitar a vinculação a um id_cargo inexistente ou inválido', async () => {
    const dadosInvalido = {
      nome: 'Enzo',
      cpf: '12345678901',
      email: 'enzo@gmail.com',
      senha: '123',
      telefone: '11999998888',
      id_cargo: 'invalido'
    };

    await expect(FuncionarioService.cadastrarFuncionario(dadosInvalido)).rejects.toEqual({
      status: 400,
      mensagem: 'Nome, CPF, e-mail, telefone e ID do cargo são obrigatórios e devem ser válidos'
    });
  });

  test('FUNC-SVC-04: Ao alterar a senha, deve validar a senha atual antes de gravar o novo hash', async () => {
    const funcionarioMock = {
      id: 5,
      senha: 'hash_antigo_no_banco'
    };

    FuncionarioRepository.findById.mockResolvedValue(funcionarioMock);
    bcrypt.compare.mockResolvedValue(false); // senha atual incorreta

    await expect(
      FuncionarioService.alterarSenha(5, {
        senhaAtual: 'senha_errada',
        novaSenha: 'novaSenha123'
      })
    ).rejects.toEqual({
      status: 401,
      mensagem: 'Senha atual incorreta'
    });

    expect(bcrypt.compare).toHaveBeenCalledWith('senha_errada', 'hash_antigo_no_banco');
    expect(FuncionarioRepository.update).not.toHaveBeenCalled();

    // Cenário com senha atual correta
    bcrypt.compare.mockResolvedValue(true);
    bcrypt.genSalt.mockResolvedValue('salt456');
    bcrypt.hash.mockResolvedValue('hash_nova_senha');
    FuncionarioRepository.update.mockResolvedValue(1);

    const resultadoSucesso = await FuncionarioService.alterarSenha(5, {
      senhaAtual: 'senha_certa',
      novaSenha: 'novaSenha123'
    });

    expect(bcrypt.compare).toHaveBeenCalledWith('senha_certa', 'hash_antigo_no_banco');
    expect(FuncionarioRepository.update).toHaveBeenCalledWith(5, {
      senha: 'hash_nova_senha'
    });
    expect(resultadoSucesso.sucesso).toBe(true);
  });
});
