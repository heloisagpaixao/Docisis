const pool = require('../config/database');
const ProdutoRepository = require('../repositories/ProdutoRepository');
const LoteRepository = require('../repositories/LoteRepository');
const EstoqueRepository = require('../repositories/EstoqueRepository');

jest.mock('../config/database', () => ({
  query: jest.fn(),
  getConnection: jest.fn()
}));

describe('Camada de Repositories - Consultas SQL e Persistência', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('REPO-01 (Leitura por Identificador): findById deve retornar o registro mapeado ou null caso não exista', async () => {
    const produtoMock = { id_produto: 1, nome: 'Bolo de Chocolate', codigo: 101 };

    // Cenário: Registro encontrado
    pool.query.mockResolvedValueOnce([[produtoMock]]);
    const resultado = await ProdutoRepository.findById(1);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id_produto = ?'),
      [1]
    );
    expect(resultado).toEqual(produtoMock);

    // Cenário: Registro inexistente
    pool.query.mockResolvedValueOnce([[]]);
    const resultadoNulo = await ProdutoRepository.findById(999);
    expect(resultadoNulo).toBeUndefined(); // rows[0] de array vazio é undefined
  });

  test('REPO-02 (Persistência): create deve executar o INSERT INTO e retornar a chave primária auto-incrementada', async () => {
    const novoProduto = {
      nome: 'Torta Alemã',
      dt_validade: '2026-10-30',
      codigo: 105,
      peso: 1.0,
      imagem: null
    };

    pool.query.mockResolvedValueOnce([{ insertId: 77 }]);

    const insertId = await ProdutoRepository.create(novoProduto);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO produtos'),
      [novoProduto.nome, novoProduto.dt_validade, novoProduto.codigo, novoProduto.peso, null]
    );
    expect(insertId).toBe(77);
  });

  test('REPO-03 (Consultas com JOIN): LoteRepository e EstoqueRepository devem executar queries estruturadas', async () => {
    // Teste de JOIN em LoteRepository.findAll (lotes com nota fiscal e produto)
    const lotesComJoinMock = [
      { id: 1, quantidade: 20, id_produto: 2, produto_nome: 'Leite Condensado', fornecedor: 'Nestlé' }
    ];
    pool.query.mockResolvedValueOnce([[{ total: 1 }]]); // countSql
    pool.query.mockResolvedValueOnce([lotesComJoinMock]); // sql com limit/offset

    const resultadoLotes = await LoteRepository.findAll();

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringMatching(/JOIN nota_fiscal nf/),
      expect.any(Array)
    );
    expect(resultadoLotes.dados).toEqual(lotesComJoinMock);

    // Teste de movimentações unificadas (ENTRADA, SAIDA, AJUSTE)
    const movimentacoesMock = [
      { tipo: 'ENTRADA', id: 1, quantidade: 10, funcionario_nome: 'Admin' },
      { tipo: 'SAIDA', id: 2, quantidade: 5, funcionario_nome: 'Operador' }
    ];
    pool.query.mockResolvedValueOnce([movimentacoesMock]);

    const resultadoMov = await LoteRepository.findMovimentacoes(1);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringMatching(/UNION ALL/),
      [1, 1, 1]
    );
    expect(resultadoMov).toEqual(movimentacoesMock);
  });
});
