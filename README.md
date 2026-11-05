# 🍰 Dosisis — Sistema Logístico

A **Dosisis** é uma plataforma web de gestão logística criada para facilitar o controle de produtos, estoque, usuários e movimentações de uma operação de confeitaria.
Com uma interface clara, acolhedora e prática, o sistema reúne as informações mais importantes em um só lugar — desde o acompanhamento de vendas até o cadastro de produtos, a entrada de mercadorias e o controle de permissões da equipe.

---

## ✨ Sobre o projeto

A Dosisis nasceu com o objetivo de transformar tarefas operacionais em uma experiência mais simples, visual e organizada. A plataforma foi pensada para que cada pessoa da equipe consiga encontrar rapidamente o que precisa, acompanhar o estoque e tomar decisões com mais segurança.
A identidade visual combina o laranja da marca com tons neutros e azul-marinho, criando uma aparência profissional sem perder o toque caloroso de uma confeitaria.

---

## 🌷 Funcionalidades

### 📊 Dashboard

- Visão geral das vendas e dos pedidos do dia.
- Indicadores de estoque, satisfação e desempenho.
- Alertas urgentes e insights de produção.

### 🧁 Cadastro de Produtos

- Cadastro de informações básicas do produto.
- Registro de nota fiscal e código SKU/EAN.
- Controle de peso, quantidade e localização.
- Informações de validade e certificação sanitária.
- Preview da imagem do produto.
- Dicas de preenchimento e alertas de validade.

### 📦 Movimentação de Produto

- Registro de entrada e saída de produtos.
- Controle de lote, validade e peso.
- Seleção de empresa ou fornecedor.
- Campo para observações adicionais.
- Visualização do saldo atual e da temperatura ideal.
- Status do produto no estoque.

### 👩‍💼 Gestão de Usuários

- Indicadores de operadores e sessões ativas.
- Listagem de usuários do sistema.
- Busca e filtro por status.
- Cargos de Administrador, Líder e Estoquista.
- CPF mascarado para maior privacidade visual.
- Cadastro de novos usuários.
- Área de segurança da rede e logs de acesso.

### 📱 Experiência responsiva

- Menu lateral retrátil, oculto por padrão.
- Interface adaptada para desktop, tablet e celular.
- Tabelas com rolagem interna em telas menores.
- Componentes reutilizáveis para facilitar a evolução do sistema.

---

## 🛠️ Tecnologias utilizadas

- **Linguagem:** Java Script
- **Frontend:** HTML e CSS
- **Backend:** Node.js e Express
- **Estilização:** CSS e Bootstrap CSS
- **Banco de dados:** MySQL
- **Testes:** Vitest
- **Gerenciador de pacotes:** npm

---

## 💻 Como rodar o projeto

### Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) — versão LTS recomendada.
- Uma instância MySQL, caso deseje utilizar a camada de persistência.

### 1. Clonar o repositório

```bash
git clone https://github.com/heloisagpaixao/Docisis
cd dosisis
```

### 2. Instalar as dependências

```bash
npm install
```

### 3. Configurar as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as configurações necessárias para o seu ambiente. Para utilizar o banco de dados, informe uma `DATABASE_URL` válida.

> Nunca envie senhas, tokens ou chaves privadas para o repositório.

### 4. Iniciar o projeto em desenvolvimento

Para iniciar a aplicação completa, com servidor e frontend:

```bash
node --watch src/server.js
```

O projeto utilizará a porta `3000` por padrão, caso nenhuma porta diferente seja definida.


## 🗂️ Estrutura do projeto

```text
docisis/
├── backend/                  # Código-fonte, APIs e lógica do servidor
│   ├── public/               # Arquivos estáticos acessíveis publicamente (ex: uploads, imagens)
│   ├── scripts/              # Scripts utilitários de automação e tarefas do servidor
│   └── src/                  # Código-fonte principal da aplicação backend
│       ├── config/           # Configurações do ambiente, conexões e serviços externos
│       ├── controllers/      # Gerencia requisições HTTP, valida dados e envia respostas
│       ├── middlewares/      # Interceptadores de requisições (autenticação, validações)
│       ├── repositories/     # Camada de comunicação direta e consultas ao banco de dados
│       ├── routes/           # Definição dos endpoints e URLs da API
│       ├── services/         # Concentra as regras de negócio e a lógica principal
│       ├── utils/            # Funções utilitárias e ajudantes reutilizáveis
│       ├── app.js            # Configuração e inicialização da estrutura do Express
│       └── server.js         # Ponto de entrada que coloca o servidor em execução
├── database/                 # Scripts SQL, migrações, rotinas e esquemas do banco
├── frontend/                 # Interface visual e código do lado do cliente
│   └── src/                  # Arquivos de código e recursos da interface
│       ├── assets/           # Mídias estáticas como imagens, ícones e fontes
│       ├── css/              # Folhas de estilo e estilização visual das páginas
│       └── js/               # Scripts do cliente para interatividade e lógica da tela
│   └── [páginas]             # Arquivos HTML ou views que compõem as telas do sistema
├── .gitignore                # Lista de arquivos e pastas ignorados pelo controle do Git
├── LICENSE                   # Termos de licença e permissões de uso do software
├── README.md                 # Documentação geral, guia de instalação e resumo do projeto
└── package.json              # Configurações do Node.js, dependências e scripts de execução
```

---

## 👥 Equipe

- **Eduardo Henrique de Jesus Chaves** — [GitHub](https://github.com/EduardoChav3s)
- **Enzo Antônio Ferreira de Araújo** — [GitHub](https://github.com/Enzo-Antonio)
- **Heloísa Gabrielly Paixão** — [GitHub](https://github.com/heloisagpaixao)
- **Pedro da Silva Andres Jimenez** — [GitHub](https://github.com/Jimenez-1503)

---

<p align="center">
  Feito com carinho, organização e muito açúcar! 🧁
</p>
