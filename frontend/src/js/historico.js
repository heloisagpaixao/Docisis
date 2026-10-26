/**
 * Docisis - Histórico Empresarial & Auditoria (historico.js)
 * Gestão de logs imutáveis, rastreabilidade ANVISA, filtros dinâmicos, paginação e emissão de comprovantes.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa Topbar
    Docisis.initTopbar();

    // 2. Estado local
    let historicoData = [];
    let currentFilter = 'todos';
    let searchQuery = '';
    let selectedPeriod = 'todos';
    let selectedOperator = 'todos';
    let currentSort = 'data_desc';
    let currentPage = 1;
    const itemsPerPage = 7;

    // Elementos DOM
    const tbody = document.getElementById('tabela-historico-corpo');
    const searchInput = document.getElementById('busca-historico');
    const selectPeriodo = document.getElementById('filtro-periodo');
    const selectOperador = document.getElementById('filtro-operador');
    const selectOrdem = document.getElementById('ordenar-historico');
    const pillButtons = document.querySelectorAll('.pill-filter-btn');
    const paginacaoInfo = document.getElementById('paginacao-info');
    const paginacaoControles = document.getElementById('paginacao-controles');
    const btnExportarCsv = document.getElementById('btn-exportar-csv');

    // KPIs
    const kpiTotal = document.getElementById('kpi-total-operacoes');
    const kpiTotalSub = document.getElementById('kpi-total-operacoes-sub');
    const kpiFinanceiro = document.getElementById('kpi-volume-financeiro');
    const kpiConformidade = document.getElementById('kpi-taxa-conformidade');
    const kpiDescartes = document.getElementById('kpi-alertas-descarte');

    // Contadores de pílulas
    const counterTodos = document.getElementById('counter-todos');
    const counterEntradas = document.getElementById('counter-entradas');
    const counterProducao = document.getElementById('counter-producao');
    const counterVendas = document.getElementById('counter-vendas');
    const counterAjustes = document.getElementById('counter-ajustes');
    const counterDescartes = document.getElementById('counter-descartes');

    // Modal de Auditoria
    const modalElement = document.getElementById('modalAuditoria');
    const auditModal = modalElement ? new bootstrap.Modal(modalElement) : null;

    // Registros iniciais padrão para auditoria completa e teste
    const dadosIniciais = [
        {
            id: 'DOC-LOG-1049',
            categoria: 'entradas',
            tipo: 'Entrada de Insumos',
            badgeClass: 'badge-docisis-success',
            icone: 'bi-box-arrow-in-down',
            data: '2026-10-19T07:15:00',
            dataFormatada: 'Hoje, 07:15',
            detalheTitulo: 'Farinha de Trigo Especial 00 (50kg)',
            detalheDesc: 'Recebimento de matéria-prima inspecionada. Laudo técnico anexo e ensaio de umidade conforme padrão fabril.',
            doc: 'NF-e 88.421',
            operador: 'Carlos Eduardo Mendes',
            valor: 480.00,
            statusBadge: 'status-ativo',
            statusTexto: 'Homologado',
            origemDestino: 'Moinho Paulista S/A -> Galpão A-02',
            lote: 'LT-2026-0941',
            validade: '15/04/2027',
            observacoes: 'Embalagens íntegras, temperatura ambiente 21°C e ausência de contaminação.',
            hash: 'SHA256: 4a8f9c118b76e2d19f5038c1a7d2b4e803e671c890123fabd7821c9056ba2341'
        },
        {
            id: 'DOC-LOG-1048',
            categoria: 'producao',
            tipo: 'Produção & Fornada',
            badgeClass: 'badge-docisis-info',
            icone: 'bi-gear-wide-connected',
            data: '2026-10-19T06:30:00',
            dataFormatada: 'Hoje, 06:30',
            detalheTitulo: 'Lote 15x Bolos Red Velvet (2.5kg)',
            detalheDesc: 'Baixa de insumos por ordem de produção fabril OP-4412. Cocção e montagem realizadas no turno da manhã.',
            doc: 'OP-4412',
            operador: 'Marina Souza Silveira',
            valor: 1125.00,
            statusBadge: 'status-ativo',
            statusTexto: 'Concluído',
            origemDestino: 'Cozinha Industrial -> Câmara Fria 01',
            lote: 'LT-RED-1910',
            validade: '24/10/2026',
            observacoes: 'Temperatura de conservação mantida a 4°C. Padrão organoléptico aprovado.',
            hash: 'SHA256: 9b2d3e410f8a7c6b5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c'
        },
        {
            id: 'DOC-LOG-1047',
            categoria: 'vendas',
            tipo: 'Venda & Faturamento',
            badgeClass: 'badge-docisis-success',
            icone: 'bi-bag-check',
            data: '2026-10-18T18:45:00',
            dataFormatada: 'Ontem, 18:45',
            detalheTitulo: 'Pedido Balcão #1042 - Kit Gourmet',
            detalheDesc: 'Venda de doces finos, trufas artesanais e embalagens para presente. Baixa automática no estoque acabado.',
            doc: 'NFC-e 10.982',
            operador: 'Ana Beatriz Rocha',
            valor: 345.80,
            statusBadge: 'status-ativo',
            statusTexto: 'Liquidado',
            origemDestino: 'Balcão Loja Centro -> Consumidor Final',
            lote: 'LT-DOC-1810',
            validade: 'N/A',
            observacoes: 'Pagamento via Cartão de Crédito aprovado e comprovante fiscal emitido.',
            hash: 'SHA256: 7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a'
        },
        {
            id: 'DOC-LOG-1046',
            categoria: 'entradas',
            tipo: 'Entrada de Insumos',
            badgeClass: 'badge-docisis-success',
            icone: 'bi-box-arrow-in-down',
            data: '2026-10-18T14:10:00',
            dataFormatada: 'Ontem, 14:10',
            detalheTitulo: 'Chocolate Belga Callebaut 70% (20kg)',
            detalheDesc: 'Recebimento de gotas de chocolate nobre importado para recheios finos e ganaches.',
            doc: 'NF-e 88.399',
            operador: 'Carlos Eduardo Mendes',
            valor: 1890.00,
            statusBadge: 'status-ativo',
            statusTexto: 'Homologado',
            origemDestino: 'Importadora Callebaut -> Galpão A-01',
            lote: 'LT-BEL-8821',
            validade: '30/11/2027',
            observacoes: 'Transporte em furgão refrigerado a 18°C. Certificado de pureza apresentado.',
            hash: 'SHA256: 3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d'
        },
        {
            id: 'DOC-LOG-1045',
            categoria: 'ajustes',
            tipo: 'Ajuste de Balanço',
            badgeClass: 'badge-docisis-warning',
            icone: 'bi-sliders',
            data: '2026-10-18T10:00:00',
            dataFormatada: 'Ontem, 10:00',
            detalheTitulo: 'Balanço Semanal Setor Confeitaria',
            detalheDesc: 'Ajuste de inventário físico com variação de +1.2kg de Açúcar de Confeiteiro Glaçúcar.',
            doc: 'INV-2026-W42',
            operador: 'Ana Beatriz Rocha',
            valor: 14.50,
            statusBadge: 'status-ativo',
            statusTexto: 'Conciliado',
            origemDestino: 'Contagem Física -> Sistema PEPS',
            lote: 'LT-GLA-0021',
            validade: '10/08/2027',
            observacoes: 'Divergência mínima absorvida em perdas de fracionamento padrão de bancada.',
            hash: 'SHA256: 1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b'
        },
        {
            id: 'DOC-LOG-1044',
            categoria: 'descartes',
            tipo: 'Descarte Sanitário',
            badgeClass: 'badge-docisis-danger',
            icone: 'bi-trash3',
            data: '2026-10-17T16:20:00',
            dataFormatada: '17/10/2026 16:20',
            detalheTitulo: 'Creme de Leite Fresco Pasteurizado (4L)',
            detalheDesc: 'Descarte preventivo por rompimento de vedação no recebimento. Em conformidade com RDC 216 ANVISA.',
            doc: 'RDC-AV-012',
            operador: 'Marina Souza Silveira',
            valor: 76.00,
            statusBadge: 'status-suspenso',
            statusTexto: 'Descartado',
            origemDestino: 'Doca de Triagem -> Descarte de Resíduos Orgânicos',
            lote: 'LT-CRM-9912',
            validade: '22/10/2026',
            observacoes: 'Lacre avariado no palete. Termo de descarte assinado pela coordenação e descartado em contentor selado.',
            hash: 'SHA256: 5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a'
        },
        {
            id: 'DOC-LOG-1043',
            categoria: 'vendas',
            tipo: 'Venda & Faturamento',
            badgeClass: 'badge-docisis-success',
            icone: 'bi-bag-check',
            data: '2026-10-17T11:30:00',
            dataFormatada: '17/10/2026 11:30',
            detalheTitulo: 'Encomenda Casamento #098 - 400 Doces Finos',
            detalheDesc: 'Faturamento de encomenda corporativa com camafeus, brigadeiros belgas e caixas personalizadas.',
            doc: 'NF-e 88.380',
            operador: 'Ana Beatriz Rocha',
            valor: 1680.00,
            statusBadge: 'status-ativo',
            statusTexto: 'Liquidado',
            origemDestino: 'Fábrica Central -> Buffet Villa das Flores',
            lote: 'LT-ENC-0980',
            validade: '20/10/2026',
            observacoes: 'Entrega refrigerada realizada com sucesso e aceite formal assinado pelo cliente.',
            hash: 'SHA256: 8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b'
        },
        {
            id: 'DOC-LOG-1042',
            categoria: 'producao',
            tipo: 'Produção & Fornada',
            badgeClass: 'badge-docisis-info',
            icone: 'bi-gear-wide-connected',
            data: '2026-10-16T15:00:00',
            dataFormatada: '16/10/2026 15:00',
            detalheTitulo: 'Fornada 120x Macarons Franceses Variados',
            detalheDesc: 'Produção artesanal com farinha de amêndoas e recheios de pistache, frutas vermelhas e chocolate.',
            doc: 'OP-4409',
            operador: 'Marina Souza Silveira',
            valor: 720.00,
            statusBadge: 'status-ativo',
            statusTexto: 'Concluído',
            origemDestino: 'Bancada Fina -> Vitrine Refrigerada',
            lote: 'LT-MAC-1610',
            validade: '23/10/2026',
            observacoes: 'Tempo de cura dos discos respeitado. Qualidade estética excelente.',
            hash: 'SHA256: 2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c'
        }
    ];

    // Carregar histórico
    async function carregarHistorico() {
        historicoData = [...dadosIniciais];

        // 1. Incorporar movimentações realizadas durante a sessão (via Estoque)
        try {
            const extras = JSON.parse(localStorage.getItem('docisis_historico_extra') || '[]');
            if (Array.isArray(extras) && extras.length > 0) {
                const registrosFormatados = extras.map((e, idx) => ({
                    id: `OP-2026-${String(9100 + idx)}`,
                    categoria: e.tipo === 'ENTRADA' ? 'entradas' : (e.tipo === 'SAIDA' ? 'vendas' : 'ajustes'),
                    tipo: e.tipo === 'ENTRADA' ? 'Entrada de Insumo' : (e.tipo === 'SAIDA' ? 'Saída de Estoque' : 'Ajuste de Estoque'),
                    badgeClass: e.tipo === 'ENTRADA' ? 'badge-docisis-success' : (e.tipo === 'SAIDA' ? 'badge-docisis-info' : 'badge-docisis-warning'),
                    icone: e.tipo === 'ENTRADA' ? 'bi-box-arrow-in-down' : (e.tipo === 'SAIDA' ? 'bi-box-arrow-up-right' : 'bi-arrow-left-right'),
                    data: e.data_hora || new Date().toISOString(),
                    dataFormatada: Docisis.formatarData(e.data_hora) || 'Hoje, Recente',
                    detalheTitulo: e.evento || 'Movimentação Registrada',
                    detalheDesc: e.observacoes ? `${e.observacoes} • Doc: ${e.documento}` : `Doc: ${e.documento}`,
                    doc: e.documento || 'NF-INTERNA',
                    operador: e.responsavel || 'Heloisa Paixão',
                    origemDestino: 'Fábrica Central Docisis',
                    valor: Number(e.valor) || 0,
                    statusTexto: 'Auditado',
                    statusBadge: 'status-ativo',
                    lote: e.lote || 'LOT-PADRAO',
                    validade: e.validade ? Docisis.formatarData(e.validade) : 'Sob Controle',
                    observacoes: e.observacoes || 'Movimentação realizada e validada pelo operador.',
                    hash: 'SHA256: 7f8a9b' + Math.random().toString(16).slice(2, 10) + 'c3d4e5f6'
                }));
                historicoData = [...registrosFormatados, ...historicoData];
            }
        } catch (err) {
            console.warn('[Docisis Histórico] Falha ao ler extras:', err);
        }

        // 2. Tentar carregar registros adicionais da API se disponíveis
        try {
            const apiRes = await Docisis.api.get('/ajustes');
            const lista = apiRes?.data?.dados || apiRes?.data;
            if (Array.isArray(lista) && lista.length > 0) {
                const apiFormatados = lista.map((a, idx) => ({
                    id: `AJ-2026-${a.id_ajuste || idx + 1}`,
                    categoria: 'ajustes',
                    tipo: 'Ajuste de Estoque',
                    badgeClass: 'badge-docisis-warning',
                    icone: 'bi-arrow-left-right',
                    data: a.dt_ajuste || new Date().toISOString(),
                    dataFormatada: Docisis.formatarData(a.dt_ajuste),
                    detalheTitulo: `Ajuste Lote #${a.id_lote}`,
                    detalheDesc: `Motivo: ${a.motivo || 'Balanço periódico'}`,
                    doc: `AJ-${a.id_ajuste || idx + 1}`,
                    operador: 'Operador Docisis',
                    origemDestino: 'Estoque Central',
                    valor: 0,
                    statusTexto: 'Auditado',
                    statusBadge: 'status-ativo',
                    lote: `LOT-${a.id_lote}`,
                    validade: 'Conforme Lote',
                    observacoes: a.motivo || 'Ajuste de inventário registrado no backend.',
                    hash: 'SHA256: backend-' + (a.id_ajuste || idx)
                }));
                historicoData = [...apiFormatados, ...historicoData];
            }
        } catch {}

        popularOperadoresSelect();
        aplicarFiltrosEAtualizar();
    }

    // Popula o select de operadores com os nomes existentes no histórico
    function popularOperadoresSelect() {
        if (!selectOperador) return;
        const operadores = Array.from(new Set(historicoData.map(h => h.operador))).filter(Boolean);
        const optionsHtml = ['<option value="todos">Todos os Operadores</option>']
            .concat(operadores.map(op => `<option value="${op}">${op}</option>`))
            .join('');
        selectOperador.innerHTML = optionsHtml;
    }

    // Atualiza os contadores das pílulas e KPIs
    function atualizarKPIsEContadores() {
        const total = historicoData.length;
        const totalEntradas = historicoData.filter(h => h.categoria === 'entradas').length;
        const totalProducao = historicoData.filter(h => h.categoria === 'producao').length;
        const totalVendas = historicoData.filter(h => h.categoria === 'vendas').length;
        const totalAjustes = historicoData.filter(h => h.categoria === 'ajustes').length;
        const totalDescartes = historicoData.filter(h => h.categoria === 'descartes').length;

        if (counterTodos) counterTodos.textContent = total;
        if (counterEntradas) counterEntradas.textContent = totalEntradas;
        if (counterProducao) counterProducao.textContent = totalProducao;
        if (counterVendas) counterVendas.textContent = totalVendas;
        if (counterAjustes) counterAjustes.textContent = totalAjustes;
        if (counterDescartes) counterDescartes.textContent = totalDescartes;

        // KPI Financeiro total transacionado
        const volumeFinanceiro = historicoData.reduce((acc, h) => acc + (Number(h.valor) || 0), 0);

        if (kpiTotal) kpiTotal.textContent = total;
        if (kpiTotalSub) kpiTotalSub.textContent = `${total} eventos registrados`;
        if (kpiFinanceiro) kpiFinanceiro.textContent = Docisis.formatCurrency(volumeFinanceiro);
        if (kpiConformidade) kpiConformidade.textContent = totalDescartes > 0 ? '98.5%' : '100%';
        if (kpiDescartes) kpiDescartes.textContent = totalDescartes;
    }

    // Filtrar dados
    function getDadosFiltrados() {
        return historicoData.filter(item => {
            // Filtro de Pílula
            if (currentFilter !== 'todos' && item.categoria !== currentFilter) {
                return false;
            }

            // Filtro de Operador
            if (selectedOperator !== 'todos' && item.operador !== selectedOperator) {
                return false;
            }

            // Filtro de Período
            if (selectedPeriod === 'hoje') {
                const hojeStr = new Date().toISOString().slice(0, 10);
                if (!item.data.startsWith(hojeStr) && !item.dataFormatada.includes('Hoje')) return false;
            } else if (selectedPeriod === '7dias') {
                const agora = new Date().getTime();
                const itemDate = new Date(item.data).getTime();
                if (!isNaN(itemDate) && agora - itemDate > 7 * 24 * 60 * 60 * 1000) return false;
            }

            // Busca por texto
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const match = 
                    item.id.toLowerCase().includes(query) ||
                    item.operador.toLowerCase().includes(query) ||
                    item.doc.toLowerCase().includes(query) ||
                    item.detalheTitulo.toLowerCase().includes(query) ||
                    item.detalheDesc.toLowerCase().includes(query) ||
                    (item.lote && item.lote.toLowerCase().includes(query));
                if (!match) return false;
            }

            return true;
        }).sort((a, b) => {
            if (currentSort === 'data_desc') {
                return new Date(b.data) - new Date(a.data);
            }
            if (currentSort === 'data_asc') {
                return new Date(a.data) - new Date(b.data);
            }
            if (currentSort === 'valor_maior') {
                return (b.valor || 0) - (a.valor || 0);
            }
            return 0;
        });
    }

    // Renderizar tabela e paginação
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
                    <td colspan="7" class="text-center py-5 text-muted">
                        <i class="bi bi-clock-history fs-1 d-block mb-2 text-secondary opacity-50"></i>
                        <strong>Nenhum registro de auditoria encontrado para os critérios selecionados.</strong>
                        <p class="small text-muted mb-0">Tente alterar os termos de busca ou remover os filtros aplicados.</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = items.map(item => `
            <tr>
                <td>
                    <span class="history-datetime-main">${item.dataFormatada}</span>
                    <span class="history-datetime-sub">${item.id}</span>
                </td>
                <td>
                    <span class="history-op-badge ${item.badgeClass || 'badge-docisis-info'}">
                        <i class="bi ${item.icone || 'bi-activity'}" aria-hidden="true"></i> ${item.tipo}
                    </span>
                </td>
                <td>
                    <span class="history-event-title">${item.detalheTitulo}</span>
                    <span class="history-event-desc">${item.detalheDesc}</span>
                </td>
                <td>
                    <span class="history-doc-tag">${item.doc}</span>
                    <span class="history-doc-sub">${item.lote || 'Lote Padrão'}</span>
                </td>
                <td>
                    <div class="history-operator-cell">
                        <div class="avatar-operator-initials" aria-hidden="true">
                            ${Docisis.getInitials(item.operador)}
                        </div>
                        <span class="operator-name-text">${item.operador}</span>
                    </div>
                </td>
                <td>
                    <div class="value-status-box">
                        <span class="history-finance-value">${Docisis.formatCurrency(item.valor)}</span>
                        <span class="history-status-pill ${item.statusBadge || 'status-ativo'}">
                            ${item.statusTexto || 'Auditado'}
                        </span>
                    </div>
                </td>
                <td class="text-end">
                    <button type="button" class="btn-receipt-action" data-id="${item.id}" title="Ver Comprovante Oficial" aria-label="Visualizar comprovante fiscal de ${item.id}">
                        <i class="bi bi-file-earmark-text-fill" aria-hidden="true"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Conectar botões de comprovante
        tbody.querySelectorAll('.btn-receipt-action').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                abrirComprovante(id);
            });
        });
    }

    function renderPaginacao(totalItems, totalPages) {
        if (!paginacaoInfo || !paginacaoControles) return;

        if (totalItems === 0) {
            paginacaoInfo.innerHTML = 'Nenhum registro para exibir';
            paginacaoControles.innerHTML = '';
            return;
        }

        const start = (currentPage - 1) * itemsPerPage + 1;
        const end = Math.min(currentPage * itemsPerPage, totalItems);
        paginacaoInfo.innerHTML = `Exibindo <strong>${start}–${end}</strong> de <strong>${totalItems}</strong> registros de auditoria`;

        let botoesHtml = `
            <button type="button" class="page-btn" id="btn-page-prev" ${currentPage === 1 ? 'disabled' : ''} aria-label="Página anterior">
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
            <button type="button" class="page-btn" id="btn-page-next" ${currentPage === totalPages ? 'disabled' : ''} aria-label="Próxima página">
                <i class="bi bi-chevron-right"></i>
            </button>
        `;

        paginacaoControles.innerHTML = botoesHtml;

        // Eventos da paginação
        document.getElementById('btn-page-prev')?.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                aplicarFiltrosEAtualizar();
            }
        });

        document.getElementById('btn-page-next')?.addEventListener('click', () => {
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

    // Modal de Comprovante de Auditoria
    function abrirComprovante(registroId) {
        const item = historicoData.find(h => h.id === registroId);
        if (!item) return;

        document.getElementById('receipt-id').textContent = item.id;
        document.getElementById('receipt-data-hora').textContent = item.dataFormatada;
        document.getElementById('receipt-tipo').textContent = item.tipo;
        document.getElementById('receipt-doc').textContent = item.doc;
        document.getElementById('receipt-operador').textContent = item.operador;
        document.getElementById('receipt-origem-destino').textContent = item.origemDestino || 'Fábrica Central Docisis';
        document.getElementById('receipt-lote').textContent = item.lote || 'N/A';
        document.getElementById('receipt-validade').textContent = item.validade || 'N/A';
        document.getElementById('receipt-descricao').textContent = `${item.detalheTitulo} — ${item.detalheDesc}`;
        document.getElementById('receipt-observacoes').textContent = item.observacoes || 'Nenhuma observação técnica pendente.';
        document.getElementById('receipt-valor').textContent = Docisis.formatCurrency(item.valor);
        document.getElementById('receipt-hash').textContent = item.hash || 'SHA256: 0000000000000000000000000000000000000000000000000000000000000000';

        const modal = auditModal || (modalElement ? bootstrap.Modal.getOrCreateInstance(modalElement) : null);
        if (modal) {
            modal.show();
        }
    }

    // Exportação em CSV
    if (btnExportarCsv) {
        btnExportarCsv.addEventListener('click', (e) => {
            e.preventDefault();
            const filtrados = getDadosFiltrados();
            if (filtrados.length === 0) {
                Docisis.showToast('Nenhum dado para exportar com os filtros atuais.', 'warning');
                return;
            }

            const headers = ['ID', 'Data/Hora', 'Tipo', 'Documento', 'Operador', 'Lote', 'Validade', 'Valor (R$)', 'Status', 'Hash Auditoria'];
            const rows = filtrados.map(item => [
                `"${item.id}"`,
                `"${item.dataFormatada}"`,
                `"${item.tipo}"`,
                `"${item.doc}"`,
                `"${item.operador}"`,
                `"${item.lote || ''}"`,
                `"${item.validade || ''}"`,
                `"${Number(item.valor || 0).toFixed(2)}"`,
                `"${item.statusTexto || 'Auditado'}"`,
                `"${item.hash || ''}"`
            ]);

            const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `docisis-livro-auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            Docisis.showToast('Livro de registros exportado com sucesso em CSV!');
        });
    }

    // Eventos de Busca e Filtros
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim();
            currentPage = 1;
            aplicarFiltrosEAtualizar();
        });
    }

    if (selectPeriodo) {
        selectPeriodo.addEventListener('change', (e) => {
            selectedPeriod = e.target.value;
            currentPage = 1;
            aplicarFiltrosEAtualizar();
        });
    }

    if (selectOperador) {
        selectOperador.addEventListener('change', (e) => {
            selectedOperator = e.target.value;
            currentPage = 1;
            aplicarFiltrosEAtualizar();
        });
    }

    if (selectOrdem) {
        selectOrdem.addEventListener('change', (e) => {
            currentSort = e.target.value;
            aplicarFiltrosEAtualizar();
        });
    }

    // Pílulas de filtro
    pillButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            pillButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter') || 'todos';
            currentPage = 1;
            aplicarFiltrosEAtualizar();
        });
    });

    // Iniciar
    carregarHistorico();
});
