const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const FuncionarioRepository = require('../repositories/FuncionarioRepository');
const AuthService = require('../services/AuthService');

jest.mock('../repositories/FuncionarioRepository');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService - Testes Unitários', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('AUTH-SVC-01: Deve realizar login e gerar JWT quando e-mail e senha conferem', async () => {
    const funcionarioMock = {
      id: 1,
      nome: 'Eduardo',
      email: 'eduardo_admin@gmail.com',
      senha: 'hashed_password_123',
      id_cargo: 1,
      permissoes: true
    };

    FuncionarioRepository.findByEmailWithCargo.mockResolvedValue(funcionarioMock);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('mocked_jwt_token');

    const resultado = await AuthService.login('eduardo_admin@gmail.com', 'senha123');

    expect(FuncionarioRepository.findByEmailWithCargo).toHaveBeenCalledWith('eduardo_admin@gmail.com');
    expect(bcrypt.compare).toHaveBeenCalledWith('senha123', 'hashed_password_123');
    expect(jwt.sign).toHaveBeenCalled();
    expect(resultado).toEqual({
      sucesso: true,
      mensagem: 'Login realizado com sucesso.',
      token: 'mocked_jwt_token',
      funcionario: {
        id: 1,
        nome: 'Eduardo',
        email: 'eduardo_admin@gmail.com',
        id_cargo: 1,
        permissoes: true
      }
    });
  });

  test('AUTH-SVC-02: Deve lançar erro quando o e-mail não estiver cadastrado no banco', async () => {
    FuncionarioRepository.findByEmailWithCargo.mockResolvedValue(null);

    await expect(AuthService.login('inexistente@docisis.com', 'senha123'))
      .rejects.toEqual({
        status: 401,
        mensagem: 'Credenciais inválidas.'
      });
  });

  test('AUTH-SVC-03: Deve lançar erro quando a senha fornecida for incorreta', async () => {
    const funcionarioMock = {
      id: 1,
      nome: 'Eduardo',
      email: 'eduardo_admin@gmail.com',
      senha: 'hashed_password_123',
      id_cargo: 1
    };

    FuncionarioRepository.findByEmailWithCargo.mockResolvedValue(funcionarioMock);
    bcrypt.compare.mockResolvedValue(false);

    await expect(AuthService.login('eduardo_admin@gmail.com', 'senha_errada'))
      .rejects.toEqual({
        status: 401,
        mensagem: 'Credenciais inválidas.'
      });
  });
});
