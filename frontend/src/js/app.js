/**
 * DOCISIS - MÓDULO CENTRAL DA APLICAÇÃO (APP.JS)
 * Gestão de Sessão, API Client, Topbar e Utilitários Globais
 */

const Docisis = (() => {
    // Configuração base da API backend
    const API_BASE_URL = window.DOCISIS_API_URL || 'http://localhost:3000';

    // Armazenamento de Sessão
    const STORAGE_KEY_TOKEN = 'docisis_token';
    const STORAGE_KEY_USER = 'docisis_user';

    /**
     * Retorna o token JWT ativo
     */
    function getToken() {
        return localStorage.getItem(STORAGE_KEY_TOKEN);
    }

    /**
     * Salva o token JWT
     */
    function setToken(token) {
        if (token) {
            localStorage.setItem(STORAGE_KEY_TOKEN, token);
        } else {
            localStorage.removeItem(STORAGE_KEY_TOKEN);
        }
    }

    /**
     * Retorna os dados do usuário autenticado
     */
    function getUser() {
        try {
            const data = localStorage.getItem(STORAGE_KEY_USER);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }

    /**
     * Salva os dados do usuário
     */
    function setUser(user) {
        if (user) {
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
        } else {
            localStorage.removeItem(STORAGE_KEY_USER);
        }
    }

    /**
     * Encerra a sessão e redireciona para login
     */
    function logout() {
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        localStorage.removeItem(STORAGE_KEY_USER);
        window.location.href = 'login.html';
    }

    /**
     * Cliente de requisições HTTP integrado à API backend
     */
    async function api(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
        const headers = {
            'Accept': 'application/json',
            ...(options.headers || {})
        };

        const token = getToken();
        if (token && !headers['Authorization']) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Se o body for objeto simples e não FormData, converte para JSON
        let body = options.body;
        if (body && !(body instanceof FormData) && typeof body === 'object') {
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
                body
            });

            let data = null;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            return {
                ok: response.ok,
                status: response.status,
                data: data,
                error: response.ok ? null : (data?.mensagem || data?.erro || response.statusText)
            };
        } catch (err) {
            console.warn(`[Docisis API] Servidor não alcançado em ${url}:`, err.message);
            return {
                ok: false,
                status: 0,
                data: null,
                error: 'Servidor temporariamente indisponível. Verifique se o backend está em execução.'
            };
        }
    }

    /**
     * Exibe notificação flutuante (Toast)
     */
    function showToast(mensagem, tipo = 'sucesso') {
        const toast = document.getElementById('docisis-toast');
        const toastMsg = document.getElementById('toast-mensagem');
        if (!toast || !toastMsg) return;

        toastMsg.textContent = mensagem;

        // Atualiza ícone conforme tipo
        const icon = toast.querySelector('.toast-icon');
        if (icon) {
            icon.className = 'bi toast-icon fs-5 ' + (tipo === 'erro' ? 'bi-exclamation-triangle-fill text-danger' : 'bi-check-circle-fill text-success');
        }

        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }

    /**
     * Atualiza dados do usuário no cabeçalho superior (Topbar)
     */
    function initTopbar() {
        const usernameEl = document.getElementById('topbar-username');
        const initialsEl = document.getElementById('topbar-avatar-initials');

        let user = getUser();
        if (!user) {
            // Usuário padrão demonstrativo se não logado
            user = {
                nome: 'Heloisa Paixão',
                cargo: 'Chef / Administradora'
            };
        }

        if (usernameEl) {
            usernameEl.textContent = user.nome;
            usernameEl.title = `${user.nome} (${user.cargo || 'Operador'})`;
        }

        if (initialsEl) {
            const parts = (user.nome || 'Docisis').trim().split(/\s+/);
            const initials = parts.length > 1
                ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                : parts[0].slice(0, 2).toUpperCase();
            initialsEl.textContent = initials;
        }

        // Permite clique no avatar para logout se desejado
        const profileBadge = document.querySelector('.user-profile-badge');
        if (profileBadge && !profileBadge.dataset.listenerActive) {
            profileBadge.dataset.listenerActive = 'true';
            profileBadge.style.cursor = 'pointer';
            profileBadge.setAttribute('title', 'Clique para gerenciar perfil ou sair');
            profileBadge.addEventListener('click', (e) => {
                if (window.location.pathname.endsWith('funcionario.html')) return;
                // Se pressionar com Shift ou confirmação, opção de logout
                if (e.altKey) {
                    if (confirm('Deseja encerrar a sessão atual?')) {
                        logout();
                    }
                } else {
                    window.location.href = 'funcionario.html';
                }
            });
        }
    }

    /**
     * Máscara formatadora de CPF
     */
    function formatarCPF(v) {
        v = (v || '').replace(/\D/g, '');
        if (v.length > 11) v = v.slice(0, 11);
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        return v;
    }

    /**
     * Máscara formatadora de Telefone
     */
    function formatarTelefone(v) {
        v = (v || '').replace(/\D/g, '');
        if (v.length > 11) v = v.slice(0, 11);
        if (v.length > 10) {
            return v.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (v.length > 5) {
            return v.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
        } else if (v.length > 2) {
            return v.replace(/^(\d{2})(\d+)/, '($1) $2');
        }
        return v;
    }

    /**
     * Formatação monetária BRL
     */
    function formatarMoeda(valor) {
        const num = Number(valor) || 0;
        return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    /**
     * Formatação de data brasileira
     */
    function formatarData(dataIso) {
        if (!dataIso) return '--';
        try {
            const d = new Date(dataIso);
            if (isNaN(d.getTime())) return dataIso;
            return d.toLocaleDateString('pt-BR');
        } catch {
            return dataIso;
        }
    }

    // Inicialização ao carregar a página
    document.addEventListener('DOMContentLoaded', () => {
        initTopbar();

        // Aplicar máscaras automáticas em inputs com IDs comuns
        const cpfInputs = document.querySelectorAll('input[id*="cpf"]');
        cpfInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                e.target.value = formatarCPF(e.target.value);
            });
        });

        const telInputs = document.querySelectorAll('input[id*="telefone"]');
        telInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                e.target.value = formatarTelefone(e.target.value);
            });
        });
    });

    return {
        api,
        getToken,
        setToken,
        getUser,
        setUser,
        logout,
        showToast,
        initTopbar,
        formatarCPF,
        formatarTelefone,
        formatarMoeda,
        formatarData
    };
})();
