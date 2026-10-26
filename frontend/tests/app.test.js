const test = require('node:test');
const assert = require('node:assert');

// Mock DOM & Storage for Node environment
class MockLocalStorage {
    constructor() {
        this.store = {};
    }
    getItem(key) {
        return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
    }
    setItem(key, val) {
        this.store[key] = String(val);
    }
    removeItem(key) {
        delete this.store[key];
    }
    clear() {
        this.store = {};
    }
}

global.localStorage = new MockLocalStorage();
global.window = {
    DOCISIS_API_URL: 'http://localhost:3000',
    location: { href: 'estoque.html', pathname: '/estoque.html' }
};

global.document = {
    addEventListener: () => {},
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ setAttribute: () => {}, appendChild: () => {}, style: {} }),
    body: { appendChild: () => {} }
};

// Require app.js logic
const fs = require('fs');
const path = require('path');
const appCode = fs.readFileSync(path.join(__dirname, '../src/js/app.js'), 'utf8');

// Execute app.js in global context
const fn = new Function('global', 'window', 'document', 'localStorage', `${appCode}; return Docisis;`);
const Docisis = fn(global, global.window, global.document, global.localStorage);

test('Docisis Core: Session Management (Token & User)', () => {
    localStorage.clear();
    assert.strictEqual(Docisis.getToken(), null);
    assert.strictEqual(Docisis.getUser(), null);

    Docisis.setToken('test-jwt-token-12345');
    assert.strictEqual(Docisis.getToken(), 'test-jwt-token-12345');

    const sampleUser = { id: 1, nome: 'Carlos', email: 'carlos@docisis.com.br', cargo: 'ADMIN' };
    Docisis.setUser(sampleUser);
    assert.deepStrictEqual(Docisis.getUser(), sampleUser);

    Docisis.logout();
    assert.strictEqual(Docisis.getToken(), null);
    assert.strictEqual(Docisis.getUser(), null);
});

test('Docisis Core: Formatters (CPF, Telefone, Moeda, Data, Iniciais)', () => {
    // CPF
    assert.strictEqual(Docisis.formatarCPF('12345678901'), '123.456.789-01');
    assert.strictEqual(Docisis.formatarCPF('123.456.789-01'), '123.456.789-01');

    // Telefone
    assert.strictEqual(Docisis.formatarTelefone('11987654321'), '(11) 98765-4321');
    assert.strictEqual(Docisis.formatarTelefone('1133334444'), '(11) 3333-4444');

    // Moeda
    const formatado10 = Docisis.formatarMoeda(10.5);
    assert.ok(formatado10.includes('10,50') || formatado10.includes('10.50'));
    assert.ok(formatado10.includes('R$'));

    // Alias formatCurrency
    assert.strictEqual(Docisis.formatCurrency(50), Docisis.formatarMoeda(50));

    // Data
    assert.strictEqual(Docisis.formatarData('2026-10-26'), '26/10/2026');
    assert.strictEqual(Docisis.formatDate('2026-10-26'), '26/10/2026');

    // Iniciais
    assert.strictEqual(Docisis.getInitials('Carlos Eduardo'), 'CE');
    assert.strictEqual(Docisis.getInitials('Carlos'), 'CA');
    assert.strictEqual(Docisis.getInitials(''), 'DC');
});

test('Docisis Core: API Client & Helper Methods', async () => {
    assert.strictEqual(typeof Docisis.api, 'function');
    assert.strictEqual(typeof Docisis.api.get, 'function');
    assert.strictEqual(typeof Docisis.api.post, 'function');
    assert.strictEqual(typeof Docisis.api.put, 'function');
    assert.strictEqual(typeof Docisis.api.delete, 'function');

    // Test offline gracefully
    const offlineRes = await Docisis.api('/rota-teste-offline');
    assert.strictEqual(offlineRes.ok, false);
    assert.strictEqual(offlineRes.status, 0);
    assert.ok(offlineRes.error.length > 0);
});
