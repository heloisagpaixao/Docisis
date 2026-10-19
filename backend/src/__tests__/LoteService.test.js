const LoteRepository = require('../repositories/LoteRepository');
const ProdutoRepository = require('../repositories/ProdutoRepository');
const NotaFiscalRepository = require('../repositories/NotaFiscalRepository');
const LoteService = require('../services/LoteService');

jest.mock('../repositories/LoteRepository');
jest.mock('../repositories/ProdutoRepository');
jest.mock('../repositories/NotaFiscalRepository');

describe('LoteService - Testes Unitários', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('LOTE-SVC-01: Deve criar um lote associado a uma nota fiscal e produto existentes', async () => {
    const dadosLote = {
      quantidade: 50,
      id_produto: 2,
      dt_validade: '2027-12-31',
      id_nota: 3
    };

    ProdutoRepository.findById.mockResolvedValue({ id_produto: 2, nome: 'Chocolate Nobre 70%' });
    NotaFiscalRepository.findById.mockResolvedValue({ id_nota: 3, fornecedor: 'Cacau Show' });
    LoteRepository.create.mockResolvedValue(101);

    const resultado = await LoteService.cadastrarLote(dadosLote);

    expect(ProdutoRepository.findById).toHaveBeenCalledWith(2);
    expect(NotaFiscalRepository.findById).toHaveBeenCalledWith(3);
    expect(LoteRepository.create).toHaveBeenCalledWith({
      quantidade: 50,
      id_produto: 2,
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
      id_produto: 1,
      dt_validade: '2020-01-01',
      id_nota: 1
    };

    await expect(LoteService.cadastrarLote(dadosPassado)).rejects.toEqual({
      status: 400,
      mensagem: 'A data de validade não pode ser anterior à data de hoje'
    });
    expect(LoteRepository.create).not.toHaveBeenCalled();
  });

  test('LOTE-SVC-03: Deve rejeitar quantidade inicial menor ou igual a zero', async () => {
    const dadosQuantidadeZero = {
      quantidade: 0,
      id_produto: 1,
      dt_validade: '2027-01-01',
      id_nota: 1
    };

    await expect(LoteService.cadastrarLote(dadosQuantidadeZero)).rejects.toEqual({
      status: 400,
      mensagem: 'A quantidade inicial deve ser um número inteiro positivo'
    });

    const dadosQuantidadeNegativa = {
      quantidade: -10,
      id_produto: 1,
      dt_validade: '2027-01-01',
      id_nota: 1
    };

    await expect(LoteService.cadastrarLote(dadosQuantidadeNegativa)).rejects.toEqual({
      status: 400,
      mensagem: 'A quantidade inicial deve ser um número inteiro positivo'
    });

    expect(LoteRepository.create).not.toHaveBeenCalled();
  });
});
