/**
 * DOCISIS - MÓDULO DE GESTÃO E MOVIMENTAÇÃO DE ESTOQUE (ESTOQUE.JS)
 * KPIs em tempo real, listagem com busca e filtros, modal PEPS/ANVISA e exportação CSV
 */

document.addEventListener('DOMContentLoaded', () => {
    // Elementos da Tabela e Filtros
    const buscaInput = document.getElementById('busca-estoque');
    const filtroCategoria = document.getElementById('filtro-rapido-categoria');
    const ordenarEstoque = document.getElementById('ordenar-estoque');
    const tabelaCorpo = document.getElementById('tabela-estoque-corpo');
    const paginacaoInfo = document.getElementById('paginacao-info');
    const paginacaoControles = document.getElementById('paginacao-controles');
    const pillButtons = document.querySelectorAll('.pill-filter-btn');

    // Botão de Nova Movimentação e Exportação
    const btnNovaMovimentacao = document.getElementById('btn-nova-movimentacao');
    const btnExportarCsv = document.getElementById('btn-exportar-csv');

    // Elementos do Modal de Movimentação
    const modalElement = document.getElementById('modalMovimentacao');
    const formMovimentacao = document.getElementById('form-movimentacao');
    const movTypeButtons = document.querySelectorAll('.mov-type-btn');
    const selectMovProduto = document.getElementById('mov-produto');
    const selectMovTipoOperacao = document.getElementById('mov-tipo-operacao');
    const inputMovLote = document.getElementById('mov-lote');
    const inputMovValidade = document.getElementById('mov-validade');
    const inputMovQtd = document.getElementById('mov-quantidade');
    const movUnidadeMedida = document.getElementById('mov-unidade-medida');
    const inputMovCusto = document.getElementById('mov-custo-unitario');
    const inputMovDocRef = document.getElementById('mov-doc-ref');
    const inputMovObs = document.getElementById('mov-observacoes');
    const saldoAtualPreview = document.getElementById('mov-saldo-atual-preview');
    const saldoProjetadoPreview = document.getElementById('mov-saldo-projetado-preview');
    const modalOperadorNome = document.getElementById('modal-operador-nome');

    // Estado da Aplicação
    let estoqueItens = [];
    let filtroStatusAtivo = 'todos';
    let paginaAtual = 1;
    const itensPorPagina = 8;
    let tipoMovimentacaoAtual = 'entrada'; // 'entrada', 'saida', 'ajuste'

    // Conjunto de dados base com conformidade ANVISA e confeitarias artesanais
    const dadosPadrao = [
        {
            id: 1,
            nome: 'Chocolate Belga Callebaut 70%',
            sku: 'DCS-INS-2601',
            categoria: 'Insumos',
            lote_principal: 'LOT-CAL-9942',
            validade_principal: '2026-11-20',
            saldo_fisico: 42.5,
            estoque_minimo: 15.0,
            unidade_medida: 'kg',
            preco_custo: 89.90,
            preco_venda: 0,
            status: 'NORMAL'
        },
        {
            id: 2,
            nome: 'Farinha de Trigo Especial Tipo 1',
            sku: 'DCS-INS-2602',
            categoria: 'Insumos',
            lote_principal: 'LOT-FAR-8812',
            validade_principal: '2026-12-15',
            saldo_fisico: 120.0,
            estoque_minimo: 50.0,
            unidade_medida: 'kg',
            preco_custo: 6.80,
            preco_venda: 0,
            status: 'NORMAL'
        },
        {
            id: 3,
            nome: 'Manteiga Extra sem Sal 82% Gordura',
            sku: 'DCS-INS-2603',
            categoria: 'Insumos',
            lote_principal: 'LOT-MAN-4011',
            validade_principal: '2026-10-25',
            saldo_fisico: 8.5,
            estoque_minimo: 15.0,
            unidade_medida: 'kg',
            preco_custo: 38.50,
            preco_venda: 0,
            status: 'CRITICO'
        },
        {
            id: 4,
            nome: 'Morangos Selecionados de Estufa',
            sku: 'DCS-INS-2604',
            categoria: 'Insumos',
            lote_principal: 'LOT-MOR-1029',
            validade_principal: '2026-10-22',
            saldo_fisico: 6.0,
            estoque_minimo: 10.0,
            unidade_medida: 'kg',
            preco_custo: 24.00,
            preco_venda: 0,
            status: 'VENCENDO'
        },
        {
            id: 5,
            nome: 'Bolo Trufado Belga 1.2kg',
            sku: 'DCS-BOL-2601',
            categoria: 'Produtos Prontos',
            lote_principal: 'LOT-PRD-7701',
            validade_principal: '2026-10-24',
            saldo_fisico: 12,
            estoque_minimo: 5,
            unidade_medida: 'un',
            preco_custo: 42.00,
            preco_venda: 110.00,
            status: 'NORMAL'
        },
        {
            id: 6,
            nome: 'Torta Holandesa Nobre 850g',
            sku: 'DCS-TOR-2602',
            categoria: 'Produtos Prontos',
            lote_principal: 'LOT-PRD-7705',
            validade_principal: '2026-10-23',
            saldo_fisico: 4,
            estoque_minimo: 6,
            unidade_medida: 'un',
            preco_custo: 31.50,
            preco_venda: 85.00,
            status: 'CRITICO'
        },
        {
            id: 7,
            nome: 'Caixa de Presente Docisis Gold 6 un',
            sku: 'DCS-EMB-2601',
            categoria: 'Embalagens',
            lote_principal: 'LOT-EMB-3301',
            validade_principal: '2027-12-31',
            saldo_fisico: 185,
            estoque_minimo: 50,
            unidade_medida: 'un',
            preco_custo: 4.20,
            preco_venda: 0,
            status: 'NORMAL'
        },
        {
            id: 8,
            nome: 'Leite Condensado Artesanal 5kg',
            sku: 'DCS-INS-2605',
            categoria: 'Insumos',
            lote_principal: 'LOT-LEI-4420',
            validade_principal: '2026-11-05',
            saldo_fisico: 25,
            estoque_minimo: 10,
            unidade_medida: 'kg',
            preco_custo: 18.90,
            preco_venda: 0,
            status: 'NORMAL'
        }
    ];

    /**
     * Carrega os dados de estoque da API ou cache local
     */
    async function carregarEstoque() {
        estoqueItens = [...dadosPadrao];

        // Tentar obter da API
        try {
            const res = await Docisis.api('/estoque');
            if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
                estoqueItens = res.data.map(item => ({
                    id: item.id || item.id_produto,
                    nome: item.nome || item.produto_nome,
                    sku: item.sku || `DCS-${item.id}`,
                    categoria: item.categoria || 'Insumos',
                    lote_principal: item.lote || 'LOT-2026',
                    validade_principal: item.validade || '2026-11-30',
                    saldo_fisico: parseFloat(item.quantidade || item.saldo || item.estoque) || 0,
                    estoque_minimo: parseFloat(item.estoque_minimo) || 5,
                    unidade_medida: item.unidade_medida || 'un',
                    preco_custo: parseFloat(item.preco_custo || item.custo) || 10,
                    preco_venda: parseFloat(item.preco || item.preco_venda) || 0,
                    status: (parseFloat(item.quantidade) <= parseFloat(item.estoque_minimo)) ? 'CRITICO' : 'NORMAL'
                }));
            }
        } catch {}

        // Mesclar com produtos adicionados localmente via tela de produtos
        try {
            const extras = JSON.parse(localStorage.getItem('docisis_estoque_extra') || '[]');
            if (extras.length > 0) {
                estoqueItens = [...extras, ...estoqueItens];
            }
        } catch {}

        atualizarKPIs();
        renderizarTabela();
        popularSelectProdutos();
    }

    /**
     * Atualiza os Cards de KPIs e contadores de pílulas
     */
    function atualizarKPIs() {
        let totalFisico = 0;
        let totalValor = 0;
        let countVencendo = 0;
        let countCriticos = 0;
        let countNormal = 0;
        let countInsumos = 0;
        let countAcabados = 0;
        let countEmbalagens = 0;

        const hoje = new Date();

        estoqueItens.forEach(item => {
            totalFisico += item.saldo_fisico;
            totalValor += (item.saldo_fisico * item.preco_custo);

            // Verificação de vencimento (< 7 dias)
            let vencendo = false;
            if (item.validade_principal) {
                const dt = new Date(item.validade_principal);
                const diasRestantes = Math.ceil((dt - hoje) / (1000 * 60 * 60 * 24));
                if (diasRestantes <= 7) {
                    vencendo = true;
                    countVencendo++;
                }
            }

            if (item.saldo_fisico <= item.estoque_minimo) {
                countCriticos++;
                item.status = 'CRITICO';
            } else if (vencendo) {
                item.status = 'VENCENDO';
            } else {
                countNormal++;
                item.status = 'NORMAL';
            }

            if (item.categoria.toLowerCase().includes('insumo')) countInsumos++;
            else if (item.categoria.toLowerCase().includes('pronto') || item.categoria.toLowerCase().includes('bolo') || item.categoria.toLowerCase().includes('torta')) countAcabados++;
            else if (item.categoria.toLowerCase().includes('embalag')) countEmbalagens++;
        });

        const elTotalItens = document.getElementById('kpi-total-itens');
        const elTotalSkus = document.getElementById('kpi-total-skus');
        const elVencimentos = document.getElementById('kpi-vencimentos');
        const elVencimentosSub = document.getElementById('kpi-vencimentos-sub');
        const elCriticos = document.getElementById('kpi-criticos');
        const elCriticosSub = document.getElementById('kpi-criticos-sub');
        const elValorTotal = document.getElementById('kpi-valor-total');

        if (elTotalItens) elTotalItens.textContent = Math.round(totalFisico).toLocaleString('pt-BR');
        if (elTotalSkus) elTotalSkus.textContent = `${estoqueItens.length} SKUs Ativos`;
        if (elVencimentos) elVencimentos.textContent = countVencendo;
        if (elVencimentosSub) elVencimentosSub.textContent = countVencendo > 0 ? `${countVencendo} lotes vencendo em 7 dias` : 'Validades sob controle';
        if (elCriticos) elCriticos.textContent = countCriticos;
        if (elCriticosSub) elCriticosSub.textContent = countCriticos > 0 ? `${countCriticos} itens abaixo do estoque mín.` : 'Sem rupturas';
        if (elValorTotal) elValorTotal.textContent = Docisis.formatarMoeda(totalValor);

        // Contadores das pílulas
        const setCounter = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };
        setCounter('counter-todos', estoqueItens.length);
        setCounter('counter-normal', countNormal);
        setCounter('counter-critico', countCriticos);
        setCounter('counter-vencendo', countVencendo);
        setCounter('counter-insumos', countInsumos);
        setCounter('counter-acabados', countAcabados);
        setCounter('counter-embalagens', countEmbalagens);
    }

    /**
     * Filtra e ordena a lista de itens
     */
    function obterItensFiltrados() {
        const termo = (buscaInput?.value || '').toLowerCase().trim();
        const categoriaFiltro = filtroCategoria?.value || 'todos';
        const ordenacao = ordenarEstoque?.value || 'nome_asc';

        return estoqueItens.filter(item => {
            // Busca textual
            const matchBusca = !termo ||
                item.nome.toLowerCase().includes(termo) ||
                item.sku.toLowerCase().includes(termo) ||
                item.lote_principal.toLowerCase().includes(termo) ||
                item.categoria.toLowerCase().includes(termo);

            // Categoria
            const matchCat = categoriaFiltro === 'todos' || item.categoria === categoriaFiltro;

            // Pílula
            let matchPill = true;
            if (filtroStatusAtivo === 'normal') matchPill = item.status === 'NORMAL';
            else if (filtroStatusAtivo === 'critico') matchPill = item.status === 'CRITICO';
            else if (filtroStatusAtivo === 'vencendo') matchPill = item.status === 'VENCENDO';
            else if (filtroStatusAtivo === 'insumo') matchPill = item.categoria.toLowerCase().includes('insumo');
            else if (filtroStatusAtivo === 'acabado') matchPill = item.categoria.toLowerCase().includes('pronto') || item.categoria.toLowerCase().includes('bolo');
            else if (filtroStatusAtivo === 'embalagem') matchPill = item.categoria.toLowerCase().includes('embalag');

            return matchBusca && matchCat && matchPill;
        }).sort((a, b) => {
            if (ordenacao === 'nome_asc') return a.nome.localeCompare(b.nome);
            if (ordenacao === 'nome_desc') return b.nome.localeCompare(a.nome);
            if (ordenacao === 'estoque_baixo') return a.saldo_fisico - b.saldo_fisico;
            if (ordenacao === 'validade_prox') return new Date(a.validade_principal) - new Date(b.validade_principal);
            if (ordenacao === 'valor_maior') return (b.saldo_fisico * b.preco_custo) - (a.saldo_fisico * a.preco_custo);
            return 0;
        });
    }

    /**
     * Renderiza a tabela de estoque com paginação
     */
    function renderizarTabela() {
        if (!tabelaCorpo) return;
        tabelaCorpo.innerHTML = '';

        const itens = obterItensFiltrados();
        const totalItens = itens.length;
        const totalPaginas = Math.ceil(totalItens / itensPorPagina) || 1;

        if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
        if (paginaAtual < 1) paginaAtual = 1;

        const inicio = (paginaAtual - 1) * itensPorPagina;
        const fim = Math.min(inicio + itensPorPagina, totalItens);
        const itensPagina = itens.slice(inicio, fim);

        if (itensPagina.length === 0) {
            tabelaCorpo.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5 text-muted">
                        <i class="bi bi-inbox fs-2 d-block mb-2 text-secondary"></i>
                        Nenhum item encontrado para os filtros selecionados.
                    </td>
                </tr>
            `;
            if (paginacaoInfo) paginacaoInfo.textContent = 'Nenhum registro encontrado.';
            if (paginacaoControles) paginacaoControles.innerHTML = '';
            return;
        }

        itensPagina.forEach(item => {
            const tr = document.createElement('tr');

            // Badge de status visual
            let statusBadge = '<span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1"><i class="bi bi-check-circle me-1"></i> Saudável</span>';
            if (item.status === 'CRITICO') {
                statusBadge = '<span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1"><i class="bi bi-shield-slash me-1"></i> Crítico</span>';
            } else if (item.status === 'VENCENDO') {
                statusBadge = '<span class="badge badge-docisis-warning px-2 py-1"><i class="bi bi-hourglass-split me-1"></i> Vencendo</span>';
            }

            // Ícone da categoria
            let catIcon = 'bi-box-seam';
            if (item.categoria.toLowerCase().includes('insumo')) catIcon = 'bi-egg';
            else if (item.categoria.toLowerCase().includes('pronto') || item.categoria.toLowerCase().includes('bolo')) catIcon = 'bi-cake';
            else if (item.categoria.toLowerCase().includes('embalag')) catIcon = 'bi-box';

            const valorTotalItem = Docisis.formatarMoeda(item.saldo_fisico * item.preco_custo);

            tr.innerHTML = `
                <td>
                    <div class="product-cell">
                        <div class="kpi-icon-box bg-light border text-navy-docisis" style="width: 38px; height: 38px; font-size: 1.1rem;" aria-hidden="true">
                            <i class="bi ${catIcon}"></i>
                        </div>
                        <div>
                            <strong class="d-block text-navy-docisis" style="font-size: 0.92rem;">${item.nome}</strong>
                            <small class="text-muted"><span class="badge bg-light text-secondary border me-1">${item.sku}</span></small>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge bg-light text-dark border">${item.categoria}</span>
                </td>
                <td>
                    <div class="d-flex flex-column">
                        <span class="fw-semibold text-dark small"><i class="bi bi-upc-scan me-1 text-muted"></i> ${item.lote_principal}</span>
                        <small class="text-muted"><i class="bi bi-calendar3 me-1"></i> Val: ${Docisis.formatarData(item.validade_principal)}</small>
                    </div>
                </td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <span class="fw-bold ${item.saldo_fisico <= item.estoque_minimo ? 'text-danger' : 'text-dark'}" style="font-size: 0.95rem;">
                            ${item.saldo_fisico} ${item.unidade_medida}
                        </span>
                        <small class="text-muted">(mín: ${item.estoque_minimo})</small>
                    </div>
                </td>
                <td>
                    <div class="d-flex flex-column">
                        <span class="fw-bold text-success small">${valorTotalItem}</span>
                        <small class="text-muted">${Docisis.formatarMoeda(item.preco_custo)} / ${item.unidade_medida}</small>
                    </div>
                </td>
                <td>${statusBadge}</td>
                <td class="text-end">
                    <button type="button" class="btn btn-sm btn-docisis-outline py-1 px-2 btn-movimentar-item" data-id="${item.id}" title="Registrar entrada, saída ou ajuste">
                        <i class="bi bi-arrow-left-right me-1"></i> Movimentar
                    </button>
                </td>
            `;

            tabelaCorpo.appendChild(tr);
        });

        // Atualizar informações de paginação
        if (paginacaoInfo) {
            paginacaoInfo.textContent = `Mostrando ${inicio + 1} a ${fim} de ${totalItens} produtos`;
        }

        // Renderizar controles de página
        renderizarPaginacao(totalPaginas);

        // Conectar botões de movimentação da linha
        document.querySelectorAll('.btn-movimentar-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                abrirModalMovimentacao(id);
            });
        });
    }

    /**
     * Controles da Paginação
     */
    function renderizarPaginacao(totalPaginas) {
        if (!paginacaoControles) return;
        paginacaoControles.innerHTML = '';

        if (totalPaginas <= 1) return;

        // Botão Anterior
        const btnAnt = document.createElement('button');
        btnAnt.className = 'page-btn';
        btnAnt.innerHTML = '<i class="bi bi-chevron-left"></i>';
        btnAnt.disabled = paginaAtual === 1;
        btnAnt.addEventListener('click', () => {
            if (paginaAtual > 1) {
                paginaAtual--;
                renderizarTabela();
            }
        });
        paginacaoControles.appendChild(btnAnt);

        // Botões Numéricos
        for (let i = 1; i <= totalPaginas; i++) {
            const btnNum = document.createElement('button');
            btnNum.className = `page-btn ${i === paginaAtual ? 'active' : ''}`;
            btnNum.textContent = i;
            btnNum.addEventListener('click', () => {
                paginaAtual = i;
                renderizarTabela();
            });
            paginacaoControles.appendChild(btnNum);
        }

        // Botão Próximo
        const btnProx = document.createElement('button');
        btnProx.className = 'page-btn';
        btnProx.innerHTML = '<i class="bi bi-chevron-right"></i>';
        btnProx.disabled = paginaAtual === totalPaginas;
        btnProx.addEventListener('click', () => {
            if (paginaAtual < totalPaginas) {
                paginaAtual++;
                renderizarTabela();
            }
        });
        paginacaoControles.appendChild(btnProx);
    }

    /**
     * Event Listeners de Filtro e Busca
     */
    if (buscaInput) buscaInput.addEventListener('input', () => { paginaAtual = 1; renderizarTabela(); });
    if (filtroCategoria) filtroCategoria.addEventListener('change', () => { paginaAtual = 1; renderizarTabela(); });
    if (ordenarEstoque) ordenarEstoque.addEventListener('change', () => { renderizarTabela(); });

    pillButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            pillButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filtroStatusAtivo = btn.getAttribute('data-filter') || 'todos';
            paginaAtual = 1;
            renderizarTabela();
        });
    });

    /**
     * Popula opções do select no modal
     */
    function popularSelectProdutos() {
        if (!selectMovProduto) return;
        selectMovProduto.innerHTML = '<option value="">Selecione o produto...</option>';
        estoqueItens.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.nome} (${p.sku}) — Saldo: ${p.saldo_fisico} ${p.unidade_medida}`;
            opt.dataset.saldo = p.saldo_fisico;
            opt.dataset.unidade = p.unidade_medida;
            opt.dataset.custo = p.preco_custo;
            opt.dataset.lote = p.lote_principal;
            opt.dataset.validade = p.validade_principal;
            selectMovProduto.appendChild(opt);
        });
    }

    /**
     * Atualiza os motivos de operação conforme o tipo (Entrada, Saída, Ajuste)
     */
    function atualizarOpcoesOperacao(tipo) {
        if (!selectMovTipoOperacao) return;
        selectMovTipoOperacao.innerHTML = '';

        const opcoes = {
            entrada: [
                { val: 'COMPRA', txt: 'Recebimento de Compra / Fornecedor' },
                { val: 'PRODUCAO_INTERNA', txt: 'Entrada de Produção da Confeitaria' },
                { val: 'DEVOLUCAO', txt: 'Devolução de Cliente / Troca' }
            ],
            saida: [
                { val: 'CONSUMO', txt: 'Consumo em Fornada / Receita' },
                { val: 'VENDA', txt: 'Venda Balcão / Encomenda' },
                { val: 'DESCARTE_VALIDADE', txt: 'Descarte por Validade Vencida (ANVISA)' },
                { val: 'AVARIA', txt: 'Perda Operacional / Avaria' }
            ],
            ajuste: [
                { val: 'BALANCO', txt: 'Ajuste de Balanço / Inventário Físico' },
                { val: 'CORRECAO_LOTE', txt: 'Correção de Lote / Rastreabilidade' }
            ]
        };

        (opcoes[tipo] || []).forEach(o => {
            const opt = document.createElement('option');
            opt.value = o.val;
            opt.textContent = o.txt;
            selectMovTipoOperacao.appendChild(opt);
        });
    }

    /**
     * Alternância dos botões de tipo de movimentação
     */
    movTypeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            movTypeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            tipoMovimentacaoAtual = btn.getAttribute('data-type') || 'entrada';
            atualizarOpcoesOperacao(tipoMovimentacaoAtual);
            recalcularPrevisaoSaldo();
        });
    });

    /**
     * Recalcula a previsão de saldo no modal
     */
    function recalcularPrevisaoSaldo() {
        const selectedOpt = selectMovProduto?.selectedOptions[0];
        if (!selectedOpt || !selectedOpt.value) {
            if (saldoAtualPreview) saldoAtualPreview.textContent = '--';
            if (saldoProjetadoPreview) saldoProjetadoPreview.textContent = '--';
            return;
        }

        const saldoAtual = parseFloat(selectedOpt.dataset.saldo) || 0;
        const unidade = selectedOpt.dataset.unidade || 'un';
        const qtdInformada = parseFloat(inputMovQtd?.value) || 0;

        if (saldoAtualPreview) saldoAtualPreview.textContent = `${saldoAtual} ${unidade}`;

        let projetado = saldoAtual;
        if (tipoMovimentacaoAtual === 'entrada') {
            projetado = saldoAtual + qtdInformada;
        } else if (tipoMovimentacaoAtual === 'saida') {
            projetado = Math.max(0, saldoAtual - qtdInformada);
        } else if (tipoMovimentacaoAtual === 'ajuste') {
            projetado = qtdInformada;
        }

        if (saldoProjetadoPreview) {
            saldoProjetadoPreview.textContent = `${projetado} ${unidade}`;
            if (tipoMovimentacaoAtual === 'saida' && qtdInformada > saldoAtual) {
                saldoProjetadoPreview.className = 'saldo-item-val text-danger';
            } else {
                saldoProjetadoPreview.className = 'saldo-item-val text-success';
            }
        }
    }

    if (selectMovProduto) {
        selectMovProduto.addEventListener('change', () => {
            const opt = selectMovProduto.selectedOptions[0];
            if (opt && opt.value) {
                if (inputMovLote) inputMovLote.value = opt.dataset.lote || '';
                if (inputMovValidade) inputMovValidade.value = opt.dataset.validade || '';
                if (inputMovCusto) inputMovCusto.value = opt.dataset.custo || '';
                if (movUnidadeMedida) movUnidadeMedida.textContent = opt.dataset.unidade || 'un';
            }
            recalcularPrevisaoSaldo();
        });
    }

    if (inputMovQtd) inputMovQtd.addEventListener('input', recalcularPrevisaoSaldo);

    /**
     * Abertura do Modal de Movimentação
     */
    function abrirModalMovimentacao(produtoId = null) {
        if (!modalElement) return;

        // Atualiza nome do operador responsável no modal
        const user = Docisis.getUser() || { nome: 'Heloisa Paixão' };
        if (modalOperadorNome) modalOperadorNome.textContent = user.nome;

        atualizarOpcoesOperacao(tipoMovimentacaoAtual);

        if (produtoId && selectMovProduto) {
            selectMovProduto.value = produtoId;
            selectMovProduto.dispatchEvent(new Event('change'));
        }

        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.show();
    }

    if (btnNovaMovimentacao) {
        btnNovaMovimentacao.addEventListener('click', () => abrirModalMovimentacao(null));
    }

    /**
     * Submissão da Movimentação
     */
    if (formMovimentacao) {
        formMovimentacao.addEventListener('submit', async (e) => {
            e.preventDefault();

            const produtoId = selectMovProduto?.value;
            const qtd = parseFloat(inputMovQtd?.value) || 0;
            const lote = inputMovLote?.value.trim() || 'LOT-GERAL';
            const motivo = selectMovTipoOperacao?.value || 'OPERACAO';
            const custo = parseFloat(inputMovCusto?.value) || 0;
            const docRef = inputMovDocRef?.value.trim() || 'NF-INTERNA';
            const obs = inputMovObs?.value.trim() || '';

            if (!produtoId || qtd <= 0) {
                Docisis.showToast('Selecione o produto e informe uma quantidade válida maior que zero.', 'erro');
                return;
            }

            const item = estoqueItens.find(p => String(p.id) === String(produtoId));
            if (!item) return;

            // Envio à rota adequada do backend conforme o tipo
            let endpoint = '/entradas';
            if (tipoMovimentacaoAtual === 'saida') endpoint = '/saidas';
            else if (tipoMovimentacaoAtual === 'ajuste') endpoint = '/ajustes';

            try {
                await Docisis.api(endpoint, {
                    method: 'POST',
                    body: {
                        id_produto: produtoId,
                        quantidade: qtd,
                        lote,
                        motivo,
                        preco_custo: custo,
                        documento: docRef,
                        observacao: obs
                    }
                });

                // Atualizar o saldo físico local
                if (tipoMovimentacaoAtual === 'entrada') {
                    item.saldo_fisico += qtd;
                } else if (tipoMovimentacaoAtual === 'saida') {
                    item.saldo_fisico = Math.max(0, item.saldo_fisico - qtd);
                } else if (tipoMovimentacaoAtual === 'ajuste') {
                    item.saldo_fisico = qtd;
                }

                // Registrar auditoria em histórico local
                try {
                    const historicoExtra = JSON.parse(localStorage.getItem('docisis_historico_extra') || '[]');
                    const user = Docisis.getUser() || { nome: 'Heloisa Paixão' };
                    historicoExtra.unshift({
                        id: Date.now(),
                        data_hora: new Date().toISOString(),
                        tipo: tipoMovimentacaoAtual.toUpperCase(),
                        evento: `${tipoMovimentacaoAtual.toUpperCase()}: ${qtd} ${item.unidade_medida} de ${item.nome}`,
                        documento: docRef,
                        responsavel: user.nome,
                        lote: lote,
                        validade: inputMovValidade?.value || item.validade_principal,
                        valor: qtd * item.preco_custo,
                        observacoes: obs
                    });
                    localStorage.setItem('docisis_historico_extra', JSON.stringify(historicoExtra));
                } catch {}

                Docisis.showToast(`Movimentação de ${item.nome} registrada com sucesso!`);

                // Fechar modal e re-renderizar
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();
                formMovimentacao.reset();

                atualizarKPIs();
                renderizarTabela();

            } catch (err) {
                Docisis.showToast('Erro ao registrar movimentação.', 'erro');
            }
        });
    }

    /**
     * Exportação de Dados em CSV
     */
    if (btnExportarCsv) {
        btnExportarCsv.addEventListener('click', (e) => {
            e.preventDefault();
            const itens = obterItensFiltrados();
            if (itens.length === 0) {
                Docisis.showToast('Nenhum dado para exportar.', 'erro');
                return;
            }

            const cabecalho = ['ID', 'Produto', 'SKU', 'Categoria', 'Lote', 'Validade', 'Saldo_Fisico', 'Unidade', 'Custo_Unitario', 'Valor_Total', 'Status'];
            const linhas = itens.map(i => [
                i.id,
                `"${i.nome.replace(/"/g, '""')}"`,
                i.sku,
                `"${i.categoria}"`,
                i.lote_principal,
                i.validade_principal,
                i.saldo_fisico,
                i.unidade_medida,
                i.preco_custo.toFixed(2),
                (i.saldo_fisico * i.preco_custo).toFixed(2),
                i.status
            ]);

            const csvContent = '\uFEFF' + [cabecalho.join(';'), ...linhas.map(l => l.join(';'))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `docisis-estoque-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            Docisis.showToast('Planilha de estoque exportada com sucesso!');
        });
    }

    carregarEstoque();
});
