const AjusteRepository = require('../repositories/AjusteRepository');
const EstoqueRepository = require('../repositories/EstoqueRepository');
const AjusteService = require('../services/AjusteService');
const EstoqueService = require('../services/EstoqueService');

jest.mock('../repositories/AjusteRepository');
jest.mock('../repositories/EstoqueRepository');

describe('AjusteService & EstoqueService - Testes Unitários', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AjusteService', () => {
    test('AJU-SVC-01: Deve permitir registrar ajuste de lote com justificativa obrigatória', async () => {
      const dadosAjuste = {
        id_lote: 3,
        id_funcionario: 2,
        quantidade_nova: 12,
        motivo: 'Avaria durante o manuseio no depósito'
      };

      AjusteRepository.create.mockResolvedValue({
        id_ajuste: 1,
        ...dadosAjuste
      });

      const resultado = await AjusteService.criarAjuste(dadosAjuste);

      expect(AjusteRepository.create).toHaveBeenCalledWith({
        id_lote: 3,
        id_funcionario: 2,
        quantidade_nova: 12,
        motivo: 'Avaria durante o manuseio no depósito'
      });
      expect(resultado).toHaveProperty('id_ajuste', 1);
    });

    test('AJU-SVC-01: Deve rejeitar ajuste de estoque se o motivo/justificativa não for informado', async () => {
      const dadosSemMotivo = {
        id_lote: 3,
        id_funcionario: 2,
        quantidade_nova: 12,
        motivo: ''
      };

      await expect(AjusteService.criarAjuste(dadosSemMotivo)).rejects.toEqual({
        status: 400,
        message: 'O motivo do ajuste é obrigatório.'
      });
      expect(AjusteRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('EstoqueService', () => {
    test('EST-SVC-01: Deve consolidar a contagem total de estoque e destacar itens abaixo do nível mínimo', async () => {
      const estoqueMock = [
        { id_estoque: 1, id_lote: 10, quantidade: 25, materia_prima: 'Farinha de Trigo' },
        { id_estoque: 2, id_lote: 11, quantidade: 3, materia_prima: 'Fermento em Pó' }
      ];

      EstoqueRepository.findAll.mockResolvedValue(estoqueMock);
      const resultadoTotal = await EstoqueService.listarEstoque();

      expect(resultadoTotal.sucesso).toBe(true);
      expect(resultadoTotal.total).toBe(2);
      expect(resultadoTotal.dados).toEqual(estoqueMock);

      // Itens abaixo do nível mínimo (limite = 5)
      const estoqueBaixoMock = [
        { id_estoque: 2, id_lote: 11, quantidade: 3, materia_prima: 'Fermento em Pó' }
      ];
      EstoqueRepository.findBaixo.mockResolvedValue(estoqueBaixoMock);

      const resultadoBaixo = await EstoqueService.buscarEstoqueBaixo(5);
      expect(EstoqueRepository.findBaixo).toHaveBeenCalledWith(5);
      expect(resultadoBaixo.sucesso).toBe(true);
      expect(resultadoBaixo.dados).toHaveLength(1);
      expect(resultadoBaixo.dados[0].materia_prima).toBe('Fermento em Pó');
    });
  });
});
