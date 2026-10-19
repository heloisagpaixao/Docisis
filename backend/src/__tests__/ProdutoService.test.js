const ProdutoRepository = require('../repositories/ProdutoRepository');
const ProdutoService = require('../services/ProdutoService');

jest.mock('../repositories/ProdutoRepository');

describe('ProdutoService - Testes Unitários', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('PROD-SVC-01: Deve cadastrar um produto válido e retornar o ID de identificação', async () => {
    const novoProduto = {
      nome: 'Bolo de Morango Especial',
      dt_validade: '2026-10-15',
      codigo: 1001,
      peso: 1.5
    };

    ProdutoRepository.findByCodigo.mockResolvedValue(null);
    ProdutoRepository.create.mockResolvedValue(42);

    const resultado = await ProdutoService.cadastrarProduto(novoProduto);

    expect(ProdutoRepository.findByCodigo).toHaveBeenCalledWith(1001);
    expect(ProdutoRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: 'Bolo de Morango Especial',
        codigo: 1001,
        peso: 1.5
      })
    );
    expect(resultado).toEqual({
      sucesso: true,
      mensagem: 'Produto cadastrado com sucesso',
      id: 42
    });
  });

  test('PROD-SVC-02: Deve rejeitar o cadastro de produtos com código já existente ou dados inválidos', async () => {
    // Código duplicado
    ProdutoRepository.findByCodigo.mockResolvedValue({ id_produto: 1, codigo: 1001, nome: 'Bolo Existente' });

    await expect(
      ProdutoService.cadastrarProduto({
        nome: 'Bolo Novo',
        dt_validade: '2026-10-15',
        codigo: 1001
      })
    ).rejects.toEqual({
      status: 400,
      mensagem: 'Já existe um produto com o código 1001'
    });

    // Campos obrigatórios ausentes
    await expect(
      ProdutoService.cadastrarProduto({
        nome: '',
        dt_validade: '',
        codigo: undefined
      })
    ).rejects.toEqual({
      status: 400,
      mensagem: 'Os campos nome, dt_validade e codigo são obrigatórios'
    });
  });

  test('PROD-SVC-03: Deve proibir a exclusão de um produto vinculado a lotes ou histórico de movimentação', async () => {
    ProdutoRepository.findById.mockResolvedValue({ id_produto: 10, nome: 'Farinha de Trigo Premium' });

    // Simula erro de chave estrangeira ao tentar deletar produto com lotes ativos
    const erroFK = new Error('Cannot delete or update a parent row: a foreign key constraint fails');
    erroFK.code = 'ER_ROW_IS_REFERENCED_2';
    ProdutoRepository.delete.mockRejectedValue(erroFK);

    await expect(ProdutoService.deletarProduto(10)).rejects.toThrow(
      'Cannot delete or update a parent row'
    );
    expect(ProdutoRepository.delete).toHaveBeenCalledWith(10);
  });
});
