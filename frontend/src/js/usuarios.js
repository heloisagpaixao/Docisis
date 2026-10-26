/**
 * Docisis - Gestão de Usuários & Permissões (usuarios.js)
 * Gerenciamento de equipe, matriz de permissões, 2FA, filtros, paginação e cadastro de operadores.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa Topbar
    Docisis.initTopbar();

    // 2. Estado local
    let usuariosData = [];
    let currentStatusFilter = 'todos';
    let currentRoleFilter = 'todos';
    let searchQuery = '';
    let currentPage = 1;
    const itemsPerPage = 6;

    // Elementos DOM da Tabela & Filtros
    const tbody = document.getElementById('tabela-usuarios-corpo');
    const searchInput = document.getElementById('busca-usuario');
    const selectCargo = document.getElementById('filtro-cargo');
    const statusPillBtns = document.querySelectorAll('.filter-pills-bar .pill-filter-btn');
    const paginacaoInfo = document.getElementById('usuarios-paginacao-info');
    const paginacaoControles = document.getElementById('usuarios-paginacao-controles');

    // KPIs
    const kpiTotalEquipe = document.getElementById('kpi-total-equipe');
    const kpiTotalEquipeSub = document.getElementById('kpi-total-equipe-sub');
    const kpiSessoesAtivas = document.getElementById('kpi-sessoes-ativas');
    const kpiSeguranca2fa = document.getElementById('kpi-seguranca-2fa');
    const kpiSeguranca2faSub = document.getElementById('kpi-seguranca-2fa-sub');
    const kpiSegurancaPendentes = document.getElementById('kpi-seguranca-pendentes');
    const kpiTotalAdmins = document.getElementById('kpi-total-admins');

    // Contadores de pílulas
    const counterTodos = document.getElementById('counter-users-todos');
    const counterAtivos = document.getElementById('counter-users-ativos');
    const counterInativos = document.getElementById('counter-users-inativos');
    const counterSuspensos = document.getElementById('counter-users-suspensos');

    // Formulário de Cadastro
    const formCadastro = document.getElementById('form-cadastro-usuario');
    const inputNome = document.getElementById('novo-nome');
    const inputEmail = document.getElementById('novo-email');
    const inputCpf = document.getElementById('novo-cpf');
    const inputTelefone = document.getElementById('novo-telefone');
    const inputSenha = document.getElementById('novo-senha');
    const btnGerarSenha = document.getElementById('btn-gerar-senha');
    const roleRadios = document.querySelectorAll('input[name="cargoPermissao"]');
    const privilegesContainer = document.querySelector('.permissions-matrix-box');

    // Matriz de privilégios descritivos por cargo
    const matrixPrivilegios = {
        ADMIN: [
            'Acesso Total e irrestrito ao sistema',
            'Gestão de Usuários, Cargos e Revogação de Acessos',
            'Configurações Globais, Fiscais e Sanitárias ANVISA',
            'Emissão e Assinatura Digital do Livro de Registros',
            'Controle Financeiro, Margens de Lucro e Estoque'
        ],
        LIDER: [
            'Consulta e Cadastro Completo de Receitas & Fichas Técnicas',
            'Registro de Baixa & Movimentações de Insumos',
            'Entrada de Lotes e Controle de Validade PEPS',
            'Aprovação de Lotes Fabris e Controle de Perdas',
            'Exportação de Relatórios de Estoque e Produção'
        ],
        OPERADOR: [
            'Consulta de Catálogo & Fichas Técnicas',
            'Registro diário de consumo de insumos na bancada',
            'Conferência de Lotes e Validades no turno',
            'Visualização de ordens de produção em andamento'
        ]
    };

    // Dados iniciais padrão (usados como base e fallback de exibição caso offline)
    const dadosIniciais = [
        {
            id: 1,
            nome: 'Ana Beatriz Rocha',
            email: 'ana.rocha@docisis.com.br',
            cpf: '123.456.789-01',
            telefone: '(11) 98765-4321',
            cargo: 'ADMIN',
            cargoNome: 'Administrador',
            status: 'ativo',
            statusNome: 'Ativo',
            tem2fa: true,
            ultimoAcessoPrincipal: 'Hoje, 07:42',
            ultimoAcessoSub: 'Há 15 min',
            ativoAgora: true
        },
        {
            id: 2,
            nome: 'Carlos Eduardo Mendes',
            email: 'carlos.mendes@docisis.com.br',
            cpf: '234.567.890-12',
            telefone: '(11) 97654-3210',
            cargo: 'LIDER',
            cargoNome: 'Líder de Equipe',
            status: 'ativo',
            statusNome: 'Ativo',
            tem2fa: true,
            ultimoAcessoPrincipal: 'Hoje, 07:15',
            ultimoAcessoSub: 'Há 42 min',
            ativoAgora: true
        },
        {
            id: 3,
            nome: 'Marina Souza Silveira',
            email: 'marina.souza@docisis.com.br',
            cpf: '345.678.901-23',
            telefone: '(11) 96543-2109',
            cargo: 'OPERADOR',
            cargoNome: 'Operador',
            status: 'ativo',
            statusNome: 'Ativo',
            tem2fa: true,
            ultimoAcessoPrincipal: 'Ontem, 17:50',
            ultimoAcessoSub: 'Turno encerrado',
            ativoAgora: false
        },
        {
            id: 4,
            nome: 'Lucas Fernando Silva',
            email: 'lucas.silva@docisis.com.br',
            cpf: '456.789.012-34',
            telefone: '(11) 95432-1098',
            cargo: 'OPERADOR',
            cargoNome: 'Operador',
            status: 'inativo',
            statusNome: 'Inativo',
            tem2fa: true,
            ultimoAcessoPrincipal: '18/09/2026',
            ultimoAcessoSub: 'Sem login recente',
            ativoAgora: false
        },
        {
            id: 5,
            nome: 'Renata Vasconcelos',
            email: 'renata.v@docisis.com.br',
            cpf: '567.890.123-45',
            telefone: '(11) 94321-0987',
            cargo: 'LIDER',
            cargoNome: 'Líder de Equipe',
            status: 'suspenso',
            statusNome: 'Suspenso',
            tem2fa: false,
            ultimoAcessoPrincipal: '02/09/2026',
            ultimoAcessoSub: 'Acesso bloqueado',
            ativoAgora: false
        }
    ];

    // Carregar usuários
    async function carregarUsuarios() {
        try {
            const apiRes = await Docisis.api.get('/funcionarios');
            const lista = apiRes?.data?.dados || apiRes?.data || (Array.isArray(apiRes) ? apiRes : null);
            if (Array.isArray(lista) && lista.length > 0) {
                usuariosData = lista.map((u, idx) => ({
                    id: u.id || idx + 1,
                    nome: u.nome || 'Operador Docisis',
                    email: u.email || 'operador@docisis.com.br',
                    cpf: u.cpf || '000.000.000-00',
                    telefone: u.telefone || '(11) 90000-0000',
                    cargo: (u.cargo || (u.id_cargo === 1 ? 'ADMIN' : (u.id_cargo === 2 ? 'LIDER' : 'OPERADOR'))).toUpperCase(),
                    cargoNome: formatCargoNome(u.cargo || (u.id_cargo === 1 ? 'ADMIN' : (u.id_cargo === 2 ? 'LIDER' : 'OPERADOR'))),
                    status: u.status || 'ativo',
                    statusNome: formatStatusNome(u.status || 'ativo'),
                    tem2fa: u.tem2fa !== undefined ? Boolean(u.tem2fa) : true,
                    ultimoAcessoPrincipal: u.ultimoAcesso || 'Hoje, 07:30',
                    ultimoAcessoSub: 'Ativo',
                    ativoAgora: u.ativoAgora !== undefined ? Boolean(u.ativoAgora) : (u.status === 'ativo')
                }));
            } else {
                usuariosData = [...dadosIniciais];
            }
        } catch {
            usuariosData = [...dadosIniciais];
        }

        aplicarFiltrosEAtualizar();
    }

    function formatCargoNome(cargo) {
        const c = String(cargo).toUpperCase();
        if (c === 'ADMIN') return 'Administrador';
        if (c === 'LIDER') return 'Líder de Equipe';
        return 'Operador';
    }

    function formatStatusNome(st) {
        const s = String(st).toLowerCase();
        if (s === 'inativo') return 'Inativo';
        if (s === 'suspenso') return 'Suspenso';
        return 'Ativo';
    }

    // Atualiza a matriz de privilégios na tela ao trocar o cargo
    function atualizarMatrizPrivilegios(cargo) {
        if (!privilegesContainer) return;
        const lista = matrixPrivilegios[cargo] || matrixPrivilegios.OPERADOR;
        privilegesContainer.innerHTML = `
            <span class="small fw-bold text-dark d-block mb-2">
                <i class="bi bi-check2-all text-success me-1" aria-hidden="true"></i> Matriz de Privilégios Ativos (${formatCargoNome(cargo)}):
            </span>
            <ul class="privileges-checklist list-unstyled mb-0 small">
                ${lista.map(item => `<li><i class="bi bi-check-circle-fill text-success me-1" aria-hidden="true"></i> ${item}</li>`).join('')}
            </ul>
        `;
    }

    // Gerador de senha forte aleatória
    if (btnGerarSenha && inputSenha) {
        btnGerarSenha.addEventListener('click', (e) => {
            e.preventDefault();
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
            let senha = '';
            for (let i = 0; i < 12; i++) {
                senha += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            inputSenha.value = senha;
            inputSenha.type = 'text';
            Docisis.showToast('Senha segura gerada com sucesso!', 'info');
            setTimeout(() => {
                inputSenha.type = 'password';
            }, 6000);
        });
    }

    // Máscara de CPF
    if (inputCpf) {
        inputCpf.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, '');
            if (v.length > 11) v = v.slice(0, 11);
            if (v.length > 9) {
                v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
            } else if (v.length > 6) {
                v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
            } else if (v.length > 3) {
                v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
            }
            e.target.value = v;
        });
    }

    // Máscara de Telefone
    if (inputTelefone) {
        inputTelefone.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, '');
            if (v.length > 11) v = v.slice(0, 11);
            if (v.length > 10) {
                v = v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            } else if (v.length > 5) {
                v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
            } else if (v.length > 2) {
                v = v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
            }
            e.target.value = v;
        });
    }

    // Mudança de radio de cargo
    roleRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.checked) {
                atualizarMatrizPrivilegios(radio.value);
            }
        });
    });

    // Atualizar contadores e KPIs
    function atualizarKPIsEContadores() {
        const total = usuariosData.length;
        const ativos = usuariosData.filter(u => u.status === 'ativo').length;
        const inativos = usuariosData.filter(u => u.status === 'inativo').length;
        const suspensos = usuariosData.filter(u => u.status === 'suspenso').length;
        const admins = usuariosData.filter(u => u.cargo === 'ADMIN').length;
        const com2fa = usuariosData.filter(u => u.tem2fa).length;
        const sessoesAtivas = usuariosData.filter(u => u.ativoAgora).length;
        const perc2fa = total > 0 ? Math.round((com2fa / total) * 100) : 100;
        const pendentes2fa = total - com2fa;

        if (counterTodos) counterTodos.textContent = total;
        if (counterAtivos) counterAtivos.textContent = ativos;
        if (counterInativos) counterInativos.textContent = inativos;
        if (counterSuspensos) counterSuspensos.textContent = suspensos;

        if (kpiTotalEquipe) kpiTotalEquipe.textContent = total;
        if (kpiTotalEquipeSub) kpiTotalEquipeSub.textContent = `${ativos} ativos na fábrica`;
        if (kpiSessoesAtivas) kpiSessoesAtivas.textContent = sessoesAtivas;
        if (kpiSeguranca2fa) kpiSeguranca2fa.textContent = `${perc2fa}%`;
        if (kpiSeguranca2faSub) kpiSeguranca2faSub.textContent = `${com2fa} com 2FA ativo`;
        if (kpiSegurancaPendentes) kpiSegurancaPendentes.textContent = `${pendentes2fa} em configuração`;
        if (kpiTotalAdmins) kpiTotalAdmins.textContent = admins;
    }

    // Filtragem
    function getDadosFiltrados() {
        return usuariosData.filter(user => {
            // Filtro de status
            if (currentStatusFilter !== 'todos' && user.status !== currentStatusFilter) {
                return false;
            }

            // Filtro de cargo
            if (currentRoleFilter !== 'todos' && user.cargo !== currentRoleFilter) {
                return false;
            }

            // Busca textual
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const match = 
                    user.nome.toLowerCase().includes(q) ||
                    user.email.toLowerCase().includes(q) ||
                    user.cpf.includes(q);
                if (!match) return false;
            }

            return true;
        });
    }

    function aplicarFiltrosEAtualizar() {
        atualizarKPIsEContadores();

        const filtrados = getDadosFiltrados();
        const totalItems = filtrados.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedItems = filtrados.slice(startIndex, startIndex + itemsPerPage);

        renderTabela(paginatedItems);
        renderPaginacao(totalItems, totalPages);
    }

    function renderTabela(items) {
        if (!tbody) return;

        if (items.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-5 text-muted">
                        <i class="bi bi-people fs-1 d-block mb-2 text-secondary opacity-50"></i>
                        <strong>Nenhum operador encontrado com os filtros aplicados.</strong>
                        <p class="small text-muted mb-0">Tente buscar por outro termo ou alterar os filtros de cargo e status.</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = items.map(user => {
            // Avatar badge class
            let avatarClass = 'avatar-operador';
            if (user.status === 'inativo') avatarClass = 'avatar-inativo';
            else if (user.status === 'suspenso') avatarClass = 'avatar-suspenso';
            else if (user.cargo === 'ADMIN') avatarClass = 'avatar-admin';
            else if (user.cargo === 'LIDER') avatarClass = 'avatar-lider';

            // Role badge class
            let roleBadgeClass = 'role-operador';
            let roleIcon = 'bi-person-badge-fill';
            if (user.cargo === 'ADMIN') {
                roleBadgeClass = 'role-admin';
                roleIcon = 'bi-shield-fill-check';
            } else if (user.cargo === 'LIDER') {
                roleBadgeClass = 'role-lider';
                roleIcon = 'bi-award-fill';
            }

            // Status tag
            let statusTagClass = 'status-ativo';
            let statusDotClass = 'dot-ativo';
            if (user.status === 'inativo') {
                statusTagClass = 'status-inativo';
                statusDotClass = 'dot-inativo';
            } else if (user.status === 'suspenso') {
                statusTagClass = 'status-suspenso';
                statusDotClass = 'dot-suspenso';
            }

            // 2FA badge
            const badge2fa = user.tem2fa
                ? `<span class="badge-security-2fa" title="Autenticação 2FA ativada"><i class="bi bi-shield-check text-success" aria-hidden="true"></i> Ativo</span>`
                : `<span class="badge-security-pendente" title="2FA pendente de configuração"><i class="bi bi-exclamation-triangle-fill text-warning" aria-hidden="true"></i> Pendente</span>`;

            // Ações disponíveis
            let toggleBtn = '';
            if (user.status === 'suspenso') {
                toggleBtn = `
                    <button type="button" class="btn-table-action text-success btn-toggle-status" data-id="${user.id}" data-action="ativar" title="Desbloquear Acesso" aria-label="Desbloquear acesso de ${user.nome}">
                        <i class="bi bi-unlock-fill" aria-hidden="true"></i>
                    </button>
                `;
            } else if (user.status === 'inativo') {
                toggleBtn = `
                    <button type="button" class="btn-table-action btn-toggle-status" data-id="${user.id}" data-action="ativar" title="Reativar Conta" aria-label="Reativar conta de ${user.nome}">
                        <i class="bi bi-arrow-clockwise" aria-hidden="true"></i>
                    </button>
                `;
            } else {
                toggleBtn = `
                    <button type="button" class="btn-table-action btn-toggle-status" data-id="${user.id}" data-action="suspender" title="Suspender Acesso" aria-label="Suspender acesso de ${user.nome}">
                        <i class="bi bi-slash-circle" aria-hidden="true"></i>
                    </button>
                `;
            }

            return `
                <tr>
                    <td>
                        <div class="user-cell">
                            <div class="user-avatar-badge ${avatarClass}" aria-hidden="true">${Docisis.getInitials(user.nome)}</div>
                            <div class="user-meta">
                                <span class="user-name">${user.nome}</span>
                                <span class="user-email">${user.email}</span>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="role-badge ${roleBadgeClass}">
                            <i class="bi ${roleIcon}" aria-hidden="true"></i> ${user.cargoNome}
                        </span>
                    </td>
                    <td>
                        <span class="status-tag ${statusTagClass}">
                            <span class="status-dot ${statusDotClass}" aria-hidden="true"></span> ${user.statusNome}
                        </span>
                    </td>
                    <td>${badge2fa}</td>
                    <td>
                        <span class="timestamp-main">${user.ultimoAcessoPrincipal}</span>
                        <span class="timestamp-sub">${user.ultimoAcessoSub}</span>
                    </td>
                    <td class="text-end">
                        <div class="action-buttons-group justify-content-end">
                            ${toggleBtn}
                            <button type="button" class="btn-table-action btn-reset-password" data-id="${user.id}" title="Redefinir Senha" aria-label="Redefinir senha de ${user.nome}">
                                <i class="bi bi-key" aria-hidden="true"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Conectar botões de ação
        tbody.querySelectorAll('.btn-toggle-status').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = Number(btn.getAttribute('data-id'));
                const action = btn.getAttribute('data-action');
                toggleUserStatus(id, action);
            });
        });

        tbody.querySelectorAll('.btn-reset-password').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = Number(btn.getAttribute('data-id'));
                const u = usuariosData.find(x => x.id === id);
                if (u) {
                    Docisis.showToast(`Link de redefinição de senha enviado para ${u.email}!`, 'info');
                }
            });
        });
    }

    function toggleUserStatus(id, action) {
        const u = usuariosData.find(x => x.id === id);
        if (!u) return;

        if (action === 'ativar') {
            u.status = 'ativo';
            u.statusNome = 'Ativo';
            u.ultimoAcessoSub = 'Conta desbloqueada';
            Docisis.showToast(`Acesso do operador ${u.nome} ativado com sucesso!`, 'success');
        } else {
            u.status = 'suspenso';
            u.statusNome = 'Suspenso';
            u.ultimoAcessoSub = 'Acesso suspenso';
            u.ativoAgora = false;
            Docisis.showToast(`Acesso do operador ${u.nome} suspenso temporariamente.`, 'warning');
        }

        aplicarFiltrosEAtualizar();
    }

    function renderPaginacao(totalItems, totalPages) {
        if (!paginacaoInfo || !paginacaoControles) return;

        if (totalItems === 0) {
            paginacaoInfo.innerHTML = 'Nenhum operador para exibir';
            paginacaoControles.innerHTML = '';
            return;
        }

        const start = (currentPage - 1) * itemsPerPage + 1;
        const end = Math.min(currentPage * itemsPerPage, totalItems);
        paginacaoInfo.innerHTML = `Exibindo <strong>${start}–${end}</strong> de <strong>${totalItems}</strong> operadores cadastrados`;

        let botoesHtml = `
            <button type="button" class="page-btn" id="btn-user-page-prev" ${currentPage === 1 ? 'disabled' : ''} aria-label="Página anterior">
                <i class="bi bi-chevron-left"></i>
            </button>
        `;

        for (let p = 1; p <= totalPages; p++) {
            botoesHtml += `
                <button type="button" class="page-btn ${p === currentPage ? 'active' : ''}" data-page="${p}" ${p === currentPage ? 'aria-current="page"' : ''}>
                    ${p}
                </button>
            `;
        }

        botoesHtml += `
            <button type="button" class="page-btn" id="btn-user-page-next" ${currentPage === totalPages ? 'disabled' : ''} aria-label="Próxima página">
                <i class="bi bi-chevron-right"></i>
            </button>
        `;

        paginacaoControles.innerHTML = botoesHtml;

        document.getElementById('btn-user-page-prev')?.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                aplicarFiltrosEAtualizar();
            }
        });

        document.getElementById('btn-user-page-next')?.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                aplicarFiltrosEAtualizar();
            }
        });

        paginacaoControles.querySelectorAll('.page-btn[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                currentPage = Number(btn.getAttribute('data-page'));
                aplicarFiltrosEAtualizar();
            });
        });
    }

    // Formulário de Cadastro de Novo Usuário
    if (formCadastro) {
        formCadastro.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nome = inputNome?.value.trim();
            const email = inputEmail?.value.trim();
            const cpf = inputCpf?.value.trim();
            const telefone = inputTelefone?.value.trim();
            const senha = inputSenha?.value.trim();
            const selectedRadio = document.querySelector('input[name="cargoPermissao"]:checked');
            const cargo = selectedRadio ? selectedRadio.value : 'OPERADOR';
            const exigir2fa = document.getElementById('check-exigir-2fa')?.checked ?? true;

            if (!nome || !email || !cpf || !senha) {
                Docisis.showToast('Por favor, preencha todos os campos obrigatórios (*).', 'danger');
                return;
            }

            if (senha.length < 8) {
                Docisis.showToast('A senha deve conter no mínimo 8 caracteres.', 'warning');
                return;
            }

            const novoOperador = {
                id: Date.now(),
                nome,
                email,
                cpf,
                telefone: telefone || '(11) 90000-0000',
                cargo,
                cargoNome: formatCargoNome(cargo),
                status: 'ativo',
                statusNome: 'Ativo',
                tem2fa: exigir2fa,
                ultimoAcessoPrincipal: 'Recém Cadastrado',
                ultimoAcessoSub: 'Aguardando 1º login',
                ativoAgora: false
            };

            const submitBtn = document.getElementById('btn-cadastrar-usuario');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Cadastrando...';
            }

            try {
                // Mapeia cargo para ID compatível com o banco
                const cargoMap = { 'ADMIN': 1, 'LIDER': 2, 'OPERADOR': 3 };
                const id_cargo = cargoMap[cargo] || 3;

                // Tenta persistir no backend
                const res = await Docisis.api.post('/funcionarios', {
                    nome,
                    email,
                    cpf: cpf.replace(/\D/g, ''),
                    telefone: telefone.replace(/\D/g, ''),
                    senha,
                    id_cargo,
                    cargo
                });

                if (!res.ok && res.status > 0) {
                    Docisis.showToast(res.error || 'Não foi possível cadastrar o usuário no servidor.', 'danger');
                    return;
                }

                if (res.data && res.data.id) {
                    novoOperador.id = res.data.id;
                }
            } catch (err) {
                console.warn('[Docisis Usuários] Backend offline ou erro:', err);
            } finally {
                // Adiciona ao estado local e re-renderiza
                usuariosData.unshift(novoOperador);
                formCadastro.reset();
                atualizarMatrizPrivilegios('LIDER');

                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="bi bi-person-plus-fill me-1" aria-hidden="true"></i> Cadastrar Operador & Ativar';
                }

                Docisis.showToast(`Operador ${nome} cadastrado com sucesso!`, 'success');
                currentPage = 1;
                aplicarFiltrosEAtualizar();
            }
        });
    }

    // Botão de Relatório de Acessos
    const btnRelatorioAcessos = document.getElementById('btn-relatorio-acessos');
    if (btnRelatorioAcessos) {
        btnRelatorioAcessos.addEventListener('click', () => {
            Docisis.showToast('Preparando laudo de acessos para impressão...', 'info');
            setTimeout(() => {
                window.print();
            }, 300);
        });
    }

    // Busca
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim();
            currentPage = 1;
            aplicarFiltrosEAtualizar();
        });
    }

    // Filtro por Cargo
    if (selectCargo) {
        selectCargo.addEventListener('change', (e) => {
            currentRoleFilter = e.target.value;
            currentPage = 1;
            aplicarFiltrosEAtualizar();
        });
    }

    // Pílulas de Status
    statusPillBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            statusPillBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            currentStatusFilter = btn.getAttribute('data-status') || 'todos';
            currentPage = 1;
            aplicarFiltrosEAtualizar();
        });
    });

    // Iniciar
    carregarUsuarios();
});
