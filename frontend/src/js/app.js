/**
 * DOCISIS - MÓDULO CENTRAL DA APLICAÇÃO (APP.JS)
 * Gestão de Sessão, API Client, Topbar, Proteção de Rotas e Utilitários Globais
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
                error: response.ok ? null : (data?.mensagem || data?.erro || data?.message || response.statusText)
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

    // Métodos utilitários anexados ao api para flexibilidade
    api.get = (endpoint, options = {}) => api(endpoint, { ...options, method: 'GET' });
    api.post = (endpoint, body = {}, options = {}) => api(endpoint, { ...options, method: 'POST', body });
    api.put = (endpoint, body = {}, options = {}) => api(endpoint, { ...options, method: 'PUT', body });
    api.delete = (endpoint, options = {}) => api(endpoint, { ...options, method: 'DELETE' });

    /**
     * Extrai iniciais de um nome (ex: "Carlos Eduardo" -> "CE")
     */
    function getInitials(name) {
        if (!name) return 'DC';
        const parts = String(name).trim().split(/\s+/);
        if (parts.length > 1) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return parts[0].slice(0, 2).toUpperCase();
    }

    /**
     * Exibe notificação flutuante (Toast) com suporte a múltiplos estilos
     */
    function showToast(mensagem, tipo = 'sucesso') {
        let toast = document.getElementById('docisis-toast');
        let toastMsg = document.getElementById('toast-mensagem');

        // Criação dinâmica caso o elemento não exista na página
        if (!toast || !toastMsg) {
            let container = document.querySelector('.docisis-toast-container');
            if (!container) {
                container = document.createElement('div');
                container.className = 'docisis-toast-container';
                container.setAttribute('aria-live', 'polite');
                container.setAttribute('aria-atomic', 'true');
                document.body.appendChild(container);
            }

            toast = document.createElement('div');
            toast.id = 'docisis-toast';
            toast.className = 'docisis-toast';
            toast.setAttribute('role', 'status');
            toast.innerHTML = `
                <i class="bi bi-check-circle-fill text-success fs-5 toast-icon" aria-hidden="true"></i>
                <div>
                    <strong class="d-block text-dark fw-bold" style="font-size: 0.9rem;">Sistema Docisis</strong>
                    <span id="toast-mensagem" class="text-muted" style="font-size: 0.85rem;"></span>
                </div>
            `;
            container.appendChild(toast);
            toastMsg = document.getElementById('toast-mensagem');
        }

        toastMsg.textContent = mensagem;

        // Atualiza ícone conforme o tipo
        const icon = toast.querySelector('.toast-icon');
        const tipoNorm = String(tipo).toLowerCase();

        if (icon) {
            if (tipoNorm === 'erro' || tipoNorm === 'danger') {
                icon.className = 'bi toast-icon fs-5 bi-exclamation-triangle-fill text-danger';
            } else if (tipoNorm === 'warning' || tipoNorm === 'aviso') {
                icon.className = 'bi toast-icon fs-5 bi-exclamation-circle-fill text-warning';
            } else if (tipoNorm === 'info') {
                icon.className = 'bi toast-icon fs-5 bi-info-circle-fill text-primary';
            } else {
                icon.className = 'bi toast-icon fs-5 bi-check-circle-fill text-success';
            }
        }

        toast.classList.add('show');
        if (window.__toastTimeout) clearTimeout(window.__toastTimeout);
        window.__toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }

    /**
     * Verifica e protege páginas que exigem autenticação
     */
    function checkAuthProtection() {
        const path = window.location.pathname.toLowerCase();
        const isPublicPage = path.endsWith('login.html') || path.endsWith('cadastro.html') || path === '/' || path.endsWith('/');
        const hasSession = Boolean(getToken() || getUser());

        // Permite desativar redirecionamento automático em ambiente de teste automatizado se configurado
        if (window.__DOCISIS_DISABLE_AUTH_REDIRECT__) return;

        if (!isPublicPage && !hasSession) {
            console.warn('[Docisis Auth] Acesso não autenticado a página protegida. Redirecionando para login.html...');
            window.location.href = 'login.html';
        }
    }

    /**
     * Atualiza dados do usuário no cabeçalho superior (Topbar)
     */
    function initTopbar() {
        const usernameEl = document.getElementById('topbar-username');
        const initialsEl = document.getElementById('topbar-avatar-initials');
        const topbarUser = document.querySelector('.topbar-user');

        let user = getUser();
        if (!user) {
            user = {
                nome: 'Carlos',
                cargo: 'Chef / Administrador'
            };
        }

        if (usernameEl) {
            usernameEl.textContent = user.nome;
            usernameEl.title = `${user.nome} (${user.cargo || 'Operador'})`;
        }

        if (initialsEl) {
            const fotoSalva = localStorage.getItem('docisis_user_photo');
            if (fotoSalva) {
                initialsEl.innerHTML = `<img src="${fotoSalva}" alt="${user.nome}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
            } else {
                initialsEl.textContent = getInitials(user.nome);
            }
        }

        // Permite clique no avatar para navegação até o perfil
        const profileBadge = document.querySelector('.user-profile-badge');
        if (profileBadge && !profileBadge.dataset.listenerActive) {
            profileBadge.dataset.listenerActive = 'true';
            profileBadge.style.cursor = 'pointer';
            profileBadge.setAttribute('title', 'Clique para gerenciar perfil de funcionário');
            profileBadge.addEventListener('click', () => {
                if (!window.location.pathname.endsWith('funcionario.html')) {
                    window.location.href = 'funcionario.html';
                }
            });
        }

        // Adiciona botão explícito de logout na barra superior caso não exista
        if (topbarUser && !document.getElementById('btn-topbar-logout')) {
            const logoutBtn = document.createElement('button');
            logoutBtn.type = 'button';
            logoutBtn.id = 'btn-topbar-logout';
            logoutBtn.className = 'btn btn-sm btn-outline-secondary ms-2 border-0';
            logoutBtn.title = 'Encerrar Sessão (Sair)';
            logoutBtn.setAttribute('aria-label', 'Encerrar sessão e sair');
            logoutBtn.innerHTML = '<i class="bi bi-box-arrow-right fs-5 text-secondary" aria-hidden="true"></i>';
            logoutBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Deseja realmente encerrar sua sessão no Docisis?')) {
                    logout();
                }
            });
            topbarUser.appendChild(logoutBtn);
        }

        // Permite que o logotipo na Topbar retorne à tela principal de estoque
        const topbarLogo = document.querySelector('.topbar-brand');
        if (topbarLogo && !topbarLogo.dataset.listenerActive) {
            topbarLogo.dataset.listenerActive = 'true';
            topbarLogo.style.cursor = 'pointer';
            topbarLogo.setAttribute('title', 'Ir para Gestão de Estoque');
            topbarLogo.addEventListener('click', () => {
                if (!window.location.pathname.endsWith('estoque.html')) {
                    window.location.href = 'estoque.html';
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
     * Formatação de data brasileira (evita deslocamento de fuso em strings YYYY-MM-DD)
     */
    function formatarData(dataIso) {
        if (!dataIso) return '--';
        try {
            if (typeof dataIso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dataIso.trim())) {
                const [ano, mes, dia] = dataIso.trim().split('-');
                return `${dia}/${mes}/${ano}`;
            }
            const d = new Date(dataIso);
            if (isNaN(d.getTime())) return dataIso;
            return d.toLocaleDateString('pt-BR');
        } catch {
            return dataIso;
        }
    }

    // Inicialização ao carregar a página
    document.addEventListener('DOMContentLoaded', () => {
        checkAuthProtection();
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
        getInitials,
        formatarCPF,
        formatarTelefone,
        formatarMoeda,
        formatCurrency: formatarMoeda, // Alias para compatibilidade
        formatarData,
        formatDate: formatarData,      // Alias para compatibilidade
        checkAuthProtection
    };
})();
