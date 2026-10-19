/**
 * DOCISIS - MÓDULO DE CADASTRO DE PRODUTOS (PRODUTOS.JS)
 * Navegação por abas, gerador de SKU, cálculo de margem, upload de fotos e integração à API
 */

document.addEventListener('DOMContentLoaded', () => {
    const formProduto = document.getElementById('form-cadastro-produto');

    // Botões de navegação entre abas
    const tabBasicoBtn = document.getElementById('tab-basico-btn');
    const tabInventarioBtn = document.getElementById('tab-inventario-btn');
    const tabComplianceBtn = document.getElementById('tab-compliance-btn');

    const btnAvancarAba1 = document.getElementById('btn-avancar-aba1');
    const btnVoltarAba2 = document.getElementById('btn-voltar-aba2');
    const btnAvancarAba2 = document.getElementById('btn-avancar-aba2');
    const btnVoltarAba3 = document.getElementById('btn-voltar-aba3');

    // Botões de Envio
    const btnSalvarProduto = document.getElementById('btn-salvar-produto');
    const btnSalvarContinuar = document.getElementById('btn-salvar-continuar');

    // SKU
    const btnGerarSku = document.getElementById('btn-gerar-sku');
    const inputSku = document.getElementById('produto-sku');
    const selectCategoria = document.getElementById('produto-categoria');

    // Preços e Margem
    const inputPrecoVenda = document.getElementById('preco-venda');
    const inputCustoProducao = document.getElementById('custo-producao');
    const badgeMargemLucro = document.getElementById('badge-margem-lucro');
    const valorMargemTexto = document.getElementById('valor-margem-texto');

    // Dropzone de Imagem
    const dropzone = document.getElementById('image-dropzone');
    const fileInput = document.getElementById('foto-produto-input');
    const placeholderContent = document.getElementById('dropzone-placeholder-content');
    const previewImg = document.getElementById('image-preview-img');
    const previewOverlay = document.getElementById('image-preview-overlay');
    const btnTrocarFoto = document.getElementById('btn-trocar-foto');
    const btnRemoverFoto = document.getElementById('btn-remover-foto');
    const imageStatusBadge = document.getElementById('image-status-badge');

    // Cards Inferiores
    const metricaUltimoNome = document.getElementById('metrica-ultimo-nome');
    const metricaUltimoDetalhe = document.getElementById('metrica-ultimo-detalhe');

    let arquivoImagem = null;

    /**
     * Alternância programática de abas Bootstrap
     */
    function ativarAba(btnEl) {
        if (!btnEl) return;
        const tabInstance = bootstrap.Tab.getOrCreateInstance(btnEl);
        tabInstance.show();
    }

    if (btnAvancarAba1) {
        btnAvancarAba1.addEventListener('click', () => ativarAba(tabInventarioBtn));
    }
    if (btnVoltarAba2) {
        btnVoltarAba2.addEventListener('click', () => ativarAba(tabBasicoBtn));
    }
    if (btnAvancarAba2) {
        btnAvancarAba2.addEventListener('click', () => ativarAba(tabComplianceBtn));
    }
    if (btnVoltarAba3) {
        btnVoltarAba3.addEventListener('click', () => ativarAba(tabInventarioBtn));
    }

    /**
     * Gerador de código SKU padronizado
     */
    if (btnGerarSku && inputSku) {
        btnGerarSku.addEventListener('click', () => {
            const cat = selectCategoria?.value || 'PRD';
            const ano = new Date().getFullYear().toString().slice(-2);
            const aleatorio = Math.floor(1000 + Math.random() * 9000);
            inputSku.value = `DCS-${cat}-${ano}${aleatorio}`;
            inputSku.focus();
            Docisis.showToast(`SKU gerado: ${inputSku.value}`);
        });
    }

    /**
     * Calculador Dinâmico de Margem de Lucro
     */
    function calcularMargem() {
        const preco = parseFloat(inputPrecoVenda?.value) || 0;
        const custo = parseFloat(inputCustoProducao?.value) || 0;

        if (!badgeMargemLucro || !valorMargemTexto) return;

        badgeMargemLucro.classList.remove('positive', 'warning', 'danger');

        if (preco <= 0) {
            valorMargemTexto.textContent = 'Margem calculada após preenchimento';
            return;
        }

        const lucro = preco - custo;
        const margemPercentual = ((lucro / preco) * 100).toFixed(1);

        if (margemPercentual >= 40) {
            badgeMargemLucro.classList.add('positive');
            valorMargemTexto.innerHTML = `<i class="bi bi-arrow-up-circle me-1"></i> Margem Excelente: <strong>${margemPercentual}%</strong> (${Docisis.formatarMoeda(lucro)}/un)`;
        } else if (margemPercentual >= 15) {
            badgeMargemLucro.classList.add('warning');
            valorMargemTexto.innerHTML = `<i class="bi bi-dash-circle me-1"></i> Margem Moderada: <strong>${margemPercentual}%</strong> (${Docisis.formatarMoeda(lucro)}/un)`;
        } else {
            badgeMargemLucro.classList.add('danger');
            valorMargemTexto.innerHTML = `<i class="bi bi-exclamation-circle me-1"></i> Atenção: Margem Baixa de <strong>${margemPercentual}%</strong> (${Docisis.formatarMoeda(lucro)}/un)`;
        }
    }

    if (inputPrecoVenda) inputPrecoVenda.addEventListener('input', calcularMargem);
    if (inputCustoProducao) inputCustoProducao.addEventListener('input', calcularMargem);

    /**
     * Gestão do Dropzone e Preview de Imagem
     */
    function processarArquivoImagem(file) {
        if (!file || !file.type.startsWith('image/')) {
            Docisis.showToast('Selecione uma imagem válida (PNG, JPG, WebP).', 'erro');
            return;
        }

        arquivoImagem = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            if (previewImg) {
                previewImg.src = e.target.result;
                previewImg.classList.remove('d-none');
            }
            if (placeholderContent) placeholderContent.classList.add('d-none');
            if (previewOverlay) previewOverlay.classList.remove('d-none');
            if (imageStatusBadge) {
                imageStatusBadge.className = 'image-status-badge badge-success';
                imageStatusBadge.innerHTML = '<i class="bi bi-check-circle text-success"></i> Imagem Carregada';
            }
        };
        reader.readAsDataURL(file);
    }

    if (dropzone) {
        dropzone.addEventListener('click', (e) => {
            if (e.target.closest('#btn-trocar-foto') || e.target.closest('#btn-remover-foto')) return;
            if (fileInput) fileInput.click();
        });

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('drag-over');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('drag-over');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files && files[0]) {
                processarArquivoImagem(files[0]);
            }
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', () => {
            if (fileInput.files && fileInput.files[0]) {
                processarArquivoImagem(fileInput.files[0]);
            }
        });
    }

    if (btnTrocarFoto) {
        btnTrocarFoto.addEventListener('click', (e) => {
            e.stopPropagation();
            if (fileInput) fileInput.click();
        });
    }

    if (btnRemoverFoto) {
        btnRemoverFoto.addEventListener('click', (e) => {
            e.stopPropagation();
            arquivoImagem = null;
            if (fileInput) fileInput.value = '';
            if (previewImg) {
                previewImg.src = '#';
                previewImg.classList.add('d-none');
            }
            if (placeholderContent) placeholderContent.classList.remove('d-none');
            if (previewOverlay) previewOverlay.classList.add('d-none');
            if (imageStatusBadge) {
                imageStatusBadge.className = 'image-status-badge';
                imageStatusBadge.innerHTML = '<i class="bi bi-image text-muted"></i> Nenhuma foto';
            }
        });
    }

    /**
     * Submissão e Cadastro do Produto
     */
    async function salvarProduto(redirecionarApos = true) {
        const nome = document.getElementById('produto-nome')?.value.trim();
        const sku = document.getElementById('produto-sku')?.value.trim();
        const categoria = selectCategoria?.value;
        const precoVenda = parseFloat(inputPrecoVenda?.value) || 0;
        const custoProducao = parseFloat(inputCustoProducao?.value) || 0;
        const descricao = document.getElementById('produto-descricao')?.value.trim();

        const estoqueInicial = parseFloat(document.getElementById('estoque-inicial')?.value) || 0;
        const unidadeMedida = document.getElementById('unidade-medida')?.value || 'un';
        const estoqueMinimo = parseFloat(document.getElementById('estoque-minimo')?.value) || 5;
        const estoqueMaximo = parseFloat(document.getElementById('estoque-maximo')?.value) || 50;
        const localizacao = document.getElementById('estoque-localizacao')?.value || '';

        const lote = document.getElementById('lote-producao')?.value.trim() || 'LOT-PADRAO';
        const condicao = document.getElementById('condicao-armazenamento')?.value || 'refrigerado';
        const dataValidade = document.getElementById('data-validade')?.value || '';

        // Validação de campos obrigatórios
        if (!nome || !sku || !categoria || precoVenda <= 0) {
            ativarAba(tabBasicoBtn);
            Docisis.showToast('Preencha os campos obrigatórios na aba Informações Básicas.', 'erro');
            return;
        }

        const btnAtivo = btnSalvarProduto;
        const textoOriginal = btnAtivo ? btnAtivo.innerHTML : 'Cadastrar';
        if (btnAtivo) {
            btnAtivo.disabled = true;
            btnAtivo.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';
        }

        try {
            // Prepara FormData se houver foto, caso contrário JSON
            let payload;
            let options = { method: 'POST' };

            if (arquivoImagem) {
                payload = new FormData();
                payload.append('nome', nome);
                payload.append('sku', sku);
                payload.append('categoria', categoria);
                payload.append('preco', precoVenda);
                payload.append('preco_custo', custoProducao);
                payload.append('descricao', descricao);
                payload.append('estoque', estoqueInicial);
                payload.append('estoque_minimo', estoqueMinimo);
                payload.append('unidade_medida', unidadeMedida);
                payload.append('imagem', arquivoImagem);
                options.body = payload;
            } else {
                options.body = {
                    nome,
                    sku,
                    categoria,
                    preco: precoVenda,
                    preco_custo: custoProducao,
                    descricao,
                    estoque: estoqueInicial,
                    estoque_minimo: estoqueMinimo,
                    unidade_medida: unidadeMedida
                };
            }

            const res = await Docisis.api('/produtos', options);

            // Atualiza resumo de métricas do dia
            if (metricaUltimoNome) metricaUltimoNome.textContent = nome;
            if (metricaUltimoDetalhe) {
                metricaUltimoDetalhe.textContent = `SKU: ${sku} • Estoque: ${estoqueInicial} ${unidadeMedida}`;
            }

            // Armazenar em cache local para integração imediata caso backend offline
            try {
                const itensEstoqueLocal = JSON.parse(localStorage.getItem('docisis_estoque_extra') || '[]');
                itensEstoqueLocal.unshift({
                    id: Date.now(),
                    nome,
                    sku,
                    categoria,
                    preco_venda: precoVenda,
                    preco_custo: custoProducao,
                    saldo_fisico: estoqueInicial,
                    estoque_minimo: estoqueMinimo,
                    unidade_medida: unidadeMedida,
                    lote_principal: lote,
                    validade_principal: dataValidade || '2026-11-30',
                    status: estoqueInicial <= estoqueMinimo ? 'CRITICO' : 'NORMAL'
                });
                localStorage.setItem('docisis_estoque_extra', JSON.stringify(itensEstoqueLocal));
            } catch {}

            Docisis.showToast(`Produto "${nome}" cadastrado com sucesso!`);

            if (redirecionarApos) {
                setTimeout(() => {
                    window.location.href = 'estoque.html';
                }, 1200);
            } else {
                formProduto.reset();
                if (btnRemoverFoto) btnRemoverFoto.click();
                ativarAba(tabBasicoBtn);
                const nomeInput = document.getElementById('produto-nome');
                if (nomeInput) nomeInput.focus();
            }

        } catch (err) {
            Docisis.showToast('Erro ao cadastrar produto.', 'erro');
        } finally {
            if (btnAtivo) {
                btnAtivo.disabled = false;
                btnAtivo.innerHTML = textoOriginal;
            }
        }
    }

    if (formProduto) {
        formProduto.addEventListener('submit', (e) => {
            e.preventDefault();
            salvarProduto(true);
        });
    }

    if (btnSalvarContinuar) {
        btnSalvarContinuar.addEventListener('click', (e) => {
            e.preventDefault();
            salvarProduto(false);
        });
    }
});
