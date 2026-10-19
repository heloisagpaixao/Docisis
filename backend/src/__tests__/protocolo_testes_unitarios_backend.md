# 📋 Protocolo Oficial de Testes Unitários - Docisis Backend

**Projeto:** Docisis - Gestão Profissional de Confeitaria  
**Módulo:** Backend API (Node.js / Express)  
**Versão:** 1.0.0  
**Data:** 28 de Setembro de 2026  
**Status:** Proposto  

---

## 🎯 1. Objetivos do Protocolo

Este documento define o conjunto padrão de casos de testes unitários exigidos para garantir a qualidade, integridade e segurança de todas as camadas da aplicação backend (`Middlewares`, `Services`, `Controllers` e `Repositories`).

---

## 🛡️ 2. Camada de Middlewares (`src/middlewares/`)

### 2.1. `AuthMiddleware.js` / `Auth.js` (Autenticação JWT)
| ID | Caso de Teste | Entradas (Input) | Comportamento / Saída Esperada |
| :--- | :--- | :--- | :--- |
| **AUTH-01** | Token válido enviado | Header `Authorization: Bearer <valid_jwt>` | Chama `next()`, anexa dados em `req.usuarioId` e `req.funcionario`. |
| **AUTH-02** | Token ausente | Header `Authorization` não enviado | Retorna `HTTP 401 Unauthorized` com mensagem de erro. |
| **AUTH-03** | Formato de Header inválido | Header `Authorization: <token>` (sem `Bearer`) | Retorna `HTTP 401 Unauthorized`. |
| **AUTH-04** | Token expirado ou corrompido | Header `Authorization: Bearer <expired_jwt>` | Retorna `HTTP 401 Unauthorized` (`JsonWebTokenError`). |

### 2.2. `PermissaoMiddleware.js` (Controle de Acesso por Cargo)
| ID | Caso de Teste | Entradas (Input) | Comportamento / Saída Esperada |
| :--- | :--- | :--- | :--- |
| **PERM-01** | Cargo com acesso permitido | `req.funcionario.cargo = 'ADMIN'` em rota admin | Chama `next()`. |
| **PERM-02** | Cargo sem acesso | `req.funcionario.cargo = 'OPERADOR'` em rota admin | Retorna `HTTP 403 Forbidden`. |
| **PERM-03** | Usuário sem perfil anexado | `req.funcionario = undefined` | Retorna `HTTP 403 Forbidden`. |

---

## ⚙️ 3. Camada de Services (`src/services/` - Regras de Negócio)

*Nota: Os Services devem ser testados isoladamente utilizando Mocks dos Repositories.*

### 3.1. `AuthService.js`
* **AUTH-SVC-01:** Deve realizar login e gerar JWT quando e-mail e senha conferem (`bcrypt.compare` -> `true`).
* **AUTH-SVC-02:** Deve lançar erro quando o e-mail não estiver cadastrado no banco.
* **AUTH-SVC-03:** Deve lançar erro quando a senha fornecida for incorreta.

### 3.2. `FuncionarioService.js`
* **FUNC-SVC-01:** Deve criptografar a senha com `bcrypt.hash` antes de salvar novo funcionário.
* **FUNC-SVC-02:** Deve lançar exceção se e-mail ou CPF já estiverem cadastrados no sistema.
* **FUNC-SVC-03:** Deve rejeitar a vinculação a um `id_cargo` inexistente.
* **FUNC-SVC-04:** Ao alterar a senha, deve validar a senha atual antes de gravar o novo hash.

### 3.3. `ProdutoService.js`
* **PROD-SVC-01:** Deve cadastrar um produto válido e gerar o código de identificação.
* **PROD-SVC-02:** Deve rejeitar o cadastro de produtos com nome duplicado ou preços $\le 0$.
* **PROD-SVC-03:** Deve proibir a exclusão de um produto vinculado a lotes ativas ou histórico de movimentação.

### 3.4. `LoteService.js`
* **LOTE-SVC-01:** Deve criar um lote associado a um produto existente.
* **LOTE-SVC-02:** Deve rejeitar lotes com data de validade no passado (`dt_validade < DataAtual`).
* **LOTE-SVC-03:** Deve rejeitar quantidade inicial menor ou igual a zero.

### 3.5. `EntradaService.js` & `SaidaService.js`
* **ENT-SVC-01:** Deve registrar a entrada e incrementar o saldo atual do lote correspondente.
* **SAI-SVC-01:** Deve registrar a saída e decrementar o saldo do lote caso haja estoque suficiente.
* **SAI-SVC-02:** **Estoque Insuficiente:** Deve lançar exceção de regra de negócio se a quantidade solicitada na saída for maior que a disponível no lote.

### 3.6. `AjusteService.js` & `EstoqueService.js`
* **AJU-SVC-01:** Deve recalcular o saldo do lote após ajuste manual (perda, avaria ou sobra) e registrar justificativa obrigatória.
* **EST-SVC-01:** Deve consolidar a contagem total de estoque agrupando por produto e destacar itens com saldo abaixo do nível mínimo.

---

## 🎮 4. Camada de Controllers (`src/controllers/` - HTTP Request/Response)

*Nota: Testar tratamento de parâmetros de requisição (`req.body`, `req.params`, `req.query`) e respostas HTTP.*

| Método | Endpoint | Entrada de Teste | Resposta Esperada |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/<recurso>` | Requisição sem parâmetros | `200 OK` com Array de registros no body. |
| **GET** | `/api/<recurso>/:id` | ID existente | `200 OK` com o objeto retornado. |
| **GET** | `/api/<recurso>/:id` | ID inexistente | `404 Not Found` com `{ mensagem: '...' }`. |
| **POST** | `/api/<recurso>` | Payload válido | `201 Created` com o recurso criado. |
| **POST** | `/api/<recurso>` | Payload inválido / Erro no Service | `400 Bad Request` com detalhe da validação. |
| **PUT** | `/api/<recurso>/:id` | Payload válido | `200 OK` com os dados atualizados. |
| **DELETE**| `/api/<recurso>/:id` | ID existente | `200 OK` ou `204 No Content`. |

---

## 🗄️ 5. Camada de Repositories (`src/repositories/` - Consultas SQL)

### 5.1. Validação de Queries e Persistência
* **REPO-01 (Leitura por Identificador):** `findById` deve retornar o registro mapeado corretamente ou `null` caso não exista.
* **REPO-02 (Persistência):** `create` deve executar o `INSERT INTO` e retornar a entidade com a chave primária auto-incrementada.
* **REPO-03 (Consultas com JOIN):** Em `EstoqueRepository` e `LoteRepository`, as queries SQL com `JOIN` entre `produtos`, `lotes`, `entradas` e `saidas` devem calcular o saldo disponível sem erros de arredondamento ou chave estrangeira.

---

## 🧪 6. Matriz de Execução Recomendada

> [!TIP]
> Para implementar e rodar esta suíte de testes de maneira automatizada, recomenda-se a seguinte pilha de ferramentas no `package.json` do backend:
> * **Framework de Testes:** `Jest` ou `Vitest`
> * **Mock de Requisições HTTP:** `supertest`
> * **Execução dos Testes:** `npm test`
