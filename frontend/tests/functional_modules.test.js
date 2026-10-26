const test = require('node:test');
const assert = require('node:assert');

test('Login & 2FA Validation Rules', () => {
    // Validação de senha forte (8+ chars, upper, lower, number, special)
    const validarSenha = (senha) => ({
        length: senha.length >= 8,
        uppercase: /[A-Z]/.test(senha),
        lowercase: /[a-z]/.test(senha),
        number: /[0-9]/.test(senha),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(senha)
    });

    const fraca = validarSenha('123456');
    assert.strictEqual(Object.values(fraca).every(Boolean), false);

    const forte = validarSenha('Docisis@2026!');
    assert.strictEqual(Object.values(forte).every(Boolean), true);

    // Validação do PIN 2FA de 6 dígitos
    const validarPin = (pin) => /^\d{6}$/.test(pin);
    assert.strictEqual(validarPin('12345'), false);
    assert.strictEqual(validarPin('12345a'), false);
    assert.strictEqual(validarPin('123456'), true);
});

test('Cadastro: Role to ID Cargo Mapping', () => {
    const cargoMap = { 'ADMIN': 1, 'LIDER': 2, 'OPERADOR': 3 };
    assert.strictEqual(cargoMap['ADMIN'], 1);
    assert.strictEqual(cargoMap['LIDER'], 2);
    assert.strictEqual(cargoMap['OPERADOR'], 3);
    assert.strictEqual(cargoMap['DESCONHECIDO'] || 3, 3);
});

test('Produtos: SKU Generation and Margin Calculator', () => {
    // Gerador de SKU
    const gerarSku = (cat, ano, rand) => `DCS-${cat}-${ano}${rand}`;
    const sku = gerarSku('BOL', '26', '8910');
    assert.strictEqual(sku, 'DCS-BOL-268910');

    // Cálculo de margem
    const calcularMargem = (precoVenda, precoCusto) => {
        const lucro = precoVenda - precoCusto;
        const margem = (lucro / precoVenda) * 100;
        return { lucro, margem: parseFloat(margem.toFixed(1)) };
    };

    const res = calcularMargem(100, 40);
    assert.strictEqual(res.lucro, 60);
    assert.strictEqual(res.margem, 60.0);

    const res2 = calcularMargem(50, 45);
    assert.strictEqual(res2.lucro, 5);
    assert.strictEqual(res2.margem, 10.0);
});

test('Estoque: Movements Math & Status Classification', () => {
    // Classificação de status
    const classificarStatus = (saldo, min) => {
        if (saldo <= 0) return 'CRITICO';
        if (saldo <= min) return 'BAIXA';
        return 'NORMAL';
    };

    assert.strictEqual(classificarStatus(0, 5), 'CRITICO');
    assert.strictEqual(classificarStatus(3, 5), 'BAIXA');
    assert.strictEqual(classificarStatus(15, 5), 'NORMAL');

    // Movimentações: Entrada soma, Saída subtrai, Ajuste substitui
    let estoque = 20;
    const aplicarEntrada = (qtd) => { estoque += qtd; };
    const aplicarSaida = (qtd) => { estoque = Math.max(0, estoque - qtd); };
    const aplicarAjuste = (novaQtd) => { estoque = novaQtd; };

    aplicarEntrada(10);
    assert.strictEqual(estoque, 30);

    aplicarSaida(5);
    assert.strictEqual(estoque, 25);

    aplicarAjuste(50);
    assert.strictEqual(estoque, 50);
});

test('Estoque: CSV Export Data Structure', () => {
    const itens = [
        { id: 1, nome: 'Bolo de Morango', sku: 'DCS-BOL-01', saldo_fisico: 12, unidade_medida: 'un', status: 'NORMAL' },
        { id: 2, nome: 'Brigadeiro Belga', sku: 'DCS-DOC-02', saldo_fisico: 2, unidade_medida: 'cento', status: 'CRITICO' }
    ];

    const cabecalho = 'ID,Nome,SKU,Saldo,Unidade,Status\n';
    const linhas = itens.map(i => `${i.id},"${i.nome}","${i.sku}",${i.saldo_fisico},"${i.unidade_medida}","${i.status}"`).join('\n');
    const csv = cabecalho + linhas;

    assert.ok(csv.includes('Bolo de Morango'));
    assert.ok(csv.includes('Brigadeiro Belga'));
    assert.strictEqual(csv.split('\n').length, 3);
});

test('Usuários: Filter, Status & Pagination Logic', () => {
    const users = [
        { id: 1, nome: 'Carlos Mendes', cargo: 'ADMIN', status: 'ativo' },
        { id: 2, nome: 'Ana Rocha', cargo: 'LIDER', status: 'ativo' },
        { id: 3, nome: 'Marcos Silva', cargo: 'OPERADOR', status: 'inativo' },
        { id: 4, nome: 'Beatriz Lima', cargo: 'OPERADOR', status: 'suspenso' }
    ];

    // Filtro por status
    const ativos = users.filter(u => u.status === 'ativo');
    assert.strictEqual(ativos.length, 2);

    // Filtro por cargo
    const operadores = users.filter(u => u.cargo === 'OPERADOR');
    assert.strictEqual(operadores.length, 2);

    // Paginação: 2 por página
    const pageSize = 2;
    const page1 = users.slice(0, pageSize);
    const page2 = users.slice(pageSize, pageSize * 2);

    assert.strictEqual(page1.length, 2);
    assert.strictEqual(page1[0].nome, 'Carlos Mendes');
    assert.strictEqual(page2.length, 2);
    assert.strictEqual(page2[0].nome, 'Marcos Silva');
});
