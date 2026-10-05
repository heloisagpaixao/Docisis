const EntradaRepository = require('../repositories/EntradaRepository');
const SaidaRepository = require('../repositories/SaidaRepository');
const FuncionarioRepository = require('../repositories/FuncionarioRepository');
const LoteRepository = require('../repositories/LoteRepository');
const EntradaService = require('../services/EntradaService');
const SaidaService = require('../services/SaidaService');

jest.mock('../repositories/EntradaRepository', () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
}));
jest.mock('../repositories/SaidaRepository');
jest.mock('../repositories/FuncionarioRepository');
jest.mock('../repositories/LoteRepository');

describe('EntradaService & SaidaService - Testes Unitários', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('EntradaService', () => {
    test('ENT-SVC-01: Deve registrar a entrada e associar ao lote e funcionário correspondentes', async () => {
      const entradaData = {
        id_funcionario: 1,
        id_lote: 5,
        motivo: 'Recebimento de matéria-prima fornecedor'
      };

      FuncionarioRepository.findById.mockResolvedValue({ id: 1, nome: 'Ana Gerente' });
      LoteRepository.findById.mockResolvedValue({ id: 5, quantidade: 100 });
      EntradaRepository.create.mockResolvedValue(201);

      const resultado = await EntradaService.cadastrarEntrada(entradaData);

      expect(FuncionarioRepository.findById).toHaveBeenCalledWith(1);
      expect(LoteRepository.findById).toHaveBeenCalledWith(5);
      expect(EntradaRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id_funcionario: 1,
          id_lote: 5,
          motivo: 'Recebimento de matéria-prima fornecedor'
        })
      );
      expect(resultado).toEqual({
        sucesso: true,
        mensagem: 'Entrada registrada com sucesso',
        id: 201
      });
    });
  });

  describe('SaidaService', () => {
    test('SAI-SVC-01: Deve registrar a saída e atualizar o saldo do lote caso haja estoque suficiente', async () => {
      const saidaData = {
        id_funcionario: 1,
        id_lote: 5,
        quantidade: 15,
        motivo: 'Produção diária de bolos'
      };

      FuncionarioRepository.findById.mockResolvedValue({ id: 1, nome: 'Ana Gerente' });
      LoteRepository.findById.mockResolvedValue({ id: 5, quantidade: 50 });
      SaidaRepository.create.mockResolvedValue(301);

      const resultado = await SaidaService.cadastrarSaida(saidaData);

      expect(FuncionarioRepository.findById).toHaveBeenCalledWith(1);
      expect(LoteRepository.findById).toHaveBeenCalledWith(5);
      expect(SaidaRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id_funcionario: 1,
          id_lote: 5,
          quantidade: 15,
          motivo: 'Produção diária de bolos'
        })
      );
      expect(resultado).toEqual({
        sucesso: true,
        mensagem: 'Saída registrada com sucesso',
        id: 301
      });
    });

    test('SAI-SVC-02: Deve lançar exceção de regra de negócio se a quantidade solicitada for maior que a disponível no lote', async () => {
      const saidaExcessiva = {
        id_funcionario: 1,
        id_lote: 5,
        quantidade: 999,
        motivo: 'Uso extraordinário'
      };

      FuncionarioRepository.findById.mockResolvedValue({ id: 1, nome: 'Ana Gerente' });
      LoteRepository.findById.mockResolvedValue({ id: 5, quantidade: 10 });
      SaidaRepository.create.mockRejectedValue({
        status: 400,
        mensagem: 'Quantidade solicitada (999) excede a disponível no lote (10).'
      });

      await expect(SaidaService.cadastrarSaida(saidaExcessiva)).rejects.toEqual({
        status: 400,
        mensagem: 'Quantidade solicitada (999) excede a disponível no lote (10).'
      });
    });
  });
});
