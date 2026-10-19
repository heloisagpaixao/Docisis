const PermissaoMiddleware = require('../middlewares/PermissaoMiddleware')

describe('PermissaoMiddleware - Testes Unitários', () => {
    let req
    let res
    let next

    beforeEach(() => {
        jest.clearAllMocks()

        req = {
            user: null
        }

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        }

        next = jest.fn()
    })

    test('1. Deve retornar 401 se o usuário não estiver autenticado (sem req.user)', () => {
        PermissaoMiddleware(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            sucesso: false,
            erro: 'Não autenticado'
        }))
        expect(next).not.toHaveBeenCalled()
    })

    test('2. Deve retornar 403 se o campo permissões for booleano false', () => {
        req.user = { id: 1, permissoes: false }

        PermissaoMiddleware(req, res, next)

        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            sucesso: false,
            erro: 'Acesso negado'
        }))
        expect(next).not.toHaveBeenCalled()
    })

    test('3. Deve chamar next() se o usuário tiver acesso total (permissoes = true)', () => {
        req.user = { id: 1, permissoes: true }

        PermissaoMiddleware(req, res, next)

        expect(next).toHaveBeenCalledTimes(1)
        expect(res.status).not.toHaveBeenCalled()
    })

    test('4. Deve permitir o acesso se o usuário possuir a permissão necessária na string', () => {
        req.user = { id: 1, permissoes: 'cadastrar,editar,excluir' }

        // Testando como fábrica de middleware: PermissaoMiddleware('cadastrar')(req, res, next)
        const middleware = PermissaoMiddleware('cadastrar')
        middleware(req, res, next)

        expect(next).toHaveBeenCalledTimes(1)
        expect(res.status).not.toHaveBeenCalled()
    })

    test('5. Deve retornar 403 se o usuário não possuir a permissão necessária', () => {
        req.user = { id: 1, permissoes: 'visualizar' }

        const middleware = PermissaoMiddleware('excluir')
        middleware(req, res, next)

        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            sucesso: false,
            erro: 'Acesso negado'
        }))
        expect(next).not.toHaveBeenCalled()
    })
})
