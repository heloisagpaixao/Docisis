const LoteRepository = require('../repositories/LoteRepository');
const NotaFiscalRepository = require('../repositories/NotaFiscalRepository');
const LoteService = require('../services/LoteService');

jest.mock('../repositories/LoteRepository');
jest.mock('../repositories/NotaFiscalRepository');

describe('LoteService - Testes Unitários', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('LOTE-SVC-01: Deve criar um lote associado a uma nota fiscal existente', async () => {
    const dadosLote = {
      quantidade: 50,
      materia_prima: 'Chocolate Nobre 70%',
      dt_validade: '2027-12-31',
      id_nota: 3
    };

    NotaFiscalRepository.findById.mockResolvedValue({ id_nota: 3, fornecedor: 'Cacau Show' });
    LoteRepository.create.mockResolvedValue(101);

    const resultado = await LoteService.cadastrarLote(dadosLote);

    expect(NotaFiscalRepository.findById).toHaveBeenCalledWith(3);
    expect(LoteRepository.create).toHaveBeenCalledWith({
      quantidade: 50,
      materia_prima: 'Chocolate Nobre 70%',
      dt_validade: '2027-12-31',
      id_nota: 3
    });
    expect(resultado).toEqual({
      sucesso: true,
      mensagem: 'Lote cadastrado com sucesso',
      id: 101
    });
  });

  test('LOTE-SVC-02: Deve rejeitar lotes com data de validade no passado', async () => {
    const dadosPassado = {
      quantidade: 20,
      materia_prima: 'Farinha Integral',
      dt_validade: '2020-01-01',
      id_nota: 1
    };

    await expect(LoteService.cadastrarLote(dadosPassado)).rejects.toEqual({
      status: 400,
      mensagem: 'A data de validade não pode ser no passado'
    });
    expect(LoteRepository.create).not.toHaveBeenCalled();
  });

  test('LOTE-SVC-03: Deve rejeitar quantidade inicial menor ou igual a zero', async () => {
    const dadosQuantidadeZero = {
      quantidade: 0,
      materia_prima: 'Açúcar Cristal',
      dt_validade: '2027-01-01',
      id_nota: 1
    };

    await expect(LoteService.cadastrarLote(dadosQuantidadeZero)).rejects.toEqual({
      status: 400,
      mensagem: 'Os campos quantidade, materia_prima e dt_validade são obrigatórios'
    });

    const dadosQuantidadeNegativa = {
      quantidade: -10,
      materia_prima: 'Açúcar Cristal',
      dt_validade: '2027-01-01',
      id_nota: 1
    };

    await expect(LoteService.cadastrarLote(dadosQuantidadeNegativa)).rejects.toEqual({
      status: 400,
      mensagem: 'A quantidade inicial deve ser maior que zero'
    });

    expect(LoteRepository.create).not.toHaveBeenCalled();
  });
});
