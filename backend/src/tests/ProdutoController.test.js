const request = require('supertest');

// Mocks dos middlewares e serviços antes de carregar o app
jest.mock('../middlewares/AuthMiddleware', () => (req, res, next) => next());
jest.mock('../middlewares/PermissaoMiddleware', () => {
  const mw = (req, res, next) => {
    if (typeof next === 'function') return next();
    return (r, s, n) => n();
  };
  return mw;
});
jest.mock('../config/ProdutoMulter', () => ({
  single: () => (req, res, next) => next()
}));
jest.mock('../services/ProdutoService');

const app = require('../app');
const ProdutoService = require('../services/ProdutoService');

describe('Camada de Controllers - ProdutoController (HTTP Request/Response com Supertest)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /produtos: Requisição sem parâmetros deve retornar 200 OK com Array de registros', async () => {
    const mockProdutos = [
      { id_produto: 1, nome: 'Bolo de Cenoura', codigo: 101 },
      { id_produto: 2, nome: 'Bolo de Chocolate', codigo: 102 }
    ];

    ProdutoService.listarProdutos.mockResolvedValue({
      sucesso: true,
      dados: mockProdutos,
      total: 2
    });

    const response = await request(app).get('/produtos');

    expect(response.status).toBe(200);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.dados).toHaveLength(2);
    expect(ProdutoService.listarProdutos).toHaveBeenCalledTimes(1);
  });

  test('GET /produtos/:id: Com ID existente deve retornar 200 OK com o objeto retornado', async () => {
    const mockProduto = { id_produto: 1, nome: 'Bolo de Cenoura', codigo: 101 };

    ProdutoService.buscarProdutoPorId.mockResolvedValue({
      sucesso: true,
      dados: mockProduto
    });

    const response = await request(app).get('/produtos/1');

    expect(response.status).toBe(200);
    expect(response.body.dados).toEqual(mockProduto);
    expect(ProdutoService.buscarProdutoPorId).toHaveBeenCalledWith('1');
  });

  test('GET /produtos/:id: Com ID inexistente deve retornar 404 Not Found com mensagem de erro', async () => {
    ProdutoService.buscarProdutoPorId.mockRejectedValue({
      status: 404,
      mensagem: 'Produto não encontrado'
    });

    const response = await request(app).get('/produtos/999');

    expect(response.status).toBe(404);
    expect(response.body.sucesso).toBe(false);
    expect(response.body.mensagem).toBe('Produto não encontrado');
  });

  test('POST /produtos: Payload válido deve retornar 201 Created com o recurso criado', async () => {
    const payloadNovo = {
      nome: 'Torta de Limão',
      dt_validade: '2026-11-20',
      codigo: 205,
      peso: 1.2
    };

    ProdutoService.cadastrarProduto.mockResolvedValue({
      sucesso: true,
      mensagem: 'Produto cadastrado com sucesso',
      id: 50
    });

    const response = await request(app)
      .post('/produtos')
      .send(payloadNovo);

    expect(response.status).toBe(201);
    expect(response.body.sucesso).toBe(true);
    expect(response.body.id).toBe(50);
  });

  test('POST /produtos: Payload inválido / erro de validação deve retornar 400 Bad Request', async () => {
    ProdutoService.cadastrarProduto.mockRejectedValue({
      status: 400,
      mensagem: 'Os campos nome, dt_validade e codigo são obrigatórios'
    });

    const response = await request(app)
      .post('/produtos')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.sucesso).toBe(false);
    expect(response.body.mensagem).toBe('Os campos nome, dt_validade e codigo são obrigatórios');
  });

  test('PUT /produtos/:id: Payload válido deve retornar 200 OK com os dados atualizados', async () => {
    ProdutoService.atualizarProduto.mockResolvedValue({
      sucesso: true,
      mensagem: 'Produto atualizado com sucesso'
    });

    const response = await request(app)
      .put('/produtos/1')
      .send({ nome: 'Bolo de Cenoura com Cobertura Extra' });

    expect(response.status).toBe(200);
    expect(response.body.sucesso).toBe(true);
    expect(ProdutoService.atualizarProduto).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ nome: 'Bolo de Cenoura com Cobertura Extra' })
    );
  });

  test('DELETE /produtos/:id: ID existente deve retornar 200 OK', async () => {
    ProdutoService.deletarProduto.mockResolvedValue({
      sucesso: true,
      mensagem: 'Produto apagado com sucesso'
    });

    const response = await request(app).delete('/produtos/1');

    expect(response.status).toBe(200);
    expect(response.body.sucesso).toBe(true);
    expect(ProdutoService.deletarProduto).toHaveBeenCalledWith('1');
  });
});
