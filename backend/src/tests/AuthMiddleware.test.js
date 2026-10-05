const jwt = require('jsonwebtoken')
const AuthMiddleware = require('../middlewares/AuthMiddleware')

// Mock do jsonwebtoken
jest.mock('jsonwebtoken')

describe('AuthMiddleware - Testes Unitarios', () => {
    let req
    let res
    let next

    beforeEach(() => {
        jest.clearAllMocks()

        req = {
            headers: {}
        }

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        }

        next = jest.fn()
    })

    test('1. Deve retornar 401 se nenhum token for fornecido', () => {
        AuthMiddleware(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            sucesso: false,
            erro: 'Token não fornecido'
        }))
        expect(next).not.toHaveBeenCalled()
    })

    test('2. Deve retornar 401 se a string do header não tiver 2 partes', () => {
        req.headers.authorization = 'Bearer'

        AuthMiddleware(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            sucesso: false,
            erro: 'Formato de token inválido'
        }))
        expect(next).not.toHaveBeenCalled()
    })

    test('3. Deve retornar 401 se o esquema não for Bearer', () => {
        req.headers.authorization = 'Basic token123'

        AuthMiddleware(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            sucesso: false,
            erro: 'Formato de token inválido'
        }))
        expect(next).not.toHaveBeenCalled()
    })

    test('4. Deve retornar 401 se o token for inválido ou expirado', () => {
        req.headers.authorization = 'Bearer token_invalido'
        jwt.verify.mockImplementation(() => {
            throw new Error('Token inválido')
        })

        AuthMiddleware(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            sucesso: false,
            erro: 'Token inválido ou expirado'
        }))
        expect(next).not.toHaveBeenCalled()
    })

    test('5. Deve anexar o usuário na requisição e chamar next() se o token for válido', () => {
        const payloadMock = {
            id: 1,
            nome: 'Enzo',
            email: 'enzo_admin@gmail.com',
            id_cargo: 2,
            permissoes: ['READ', 'WRITE']
        }

        req.headers.authorization = 'Bearer token_valido_123'
        jwt.verify.mockReturnValue(payloadMock)

        AuthMiddleware(req, res, next)

        expect(req.user).toEqual(payloadMock)
        expect(req.funcionario).toEqual(payloadMock)
        expect(next).toHaveBeenCalledTimes(1)
        expect(res.status).not.toHaveBeenCalled()
    })
})
