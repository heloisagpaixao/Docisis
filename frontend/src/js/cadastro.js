/**
 * DOCISIS - MÓDULO DE CADASTRO DE OPERADORES (CADASTRO.JS)
 * Validação, controle de permissões e submissão à API backend
 */

document.addEventListener('DOMContentLoaded', () => {
    const formCadastro = document.getElementById('formulario-cadastro');
    const avisoCadastro = document.getElementById('aviso-cadastro');
    const selectNivelAcesso = document.getElementById('nivelAcesso');
    const painelInfoPermissao = document.getElementById('painel-info-permissao');
    const textoPermissao = document.getElementById('texto-permissao');
    const btnCadastrar = document.getElementById('btn-cadastrar');

    // Textos informativos de cada perfil de acesso
    const descricoesCargos = {
        OPERADOR: 'Perfil Operacional: Registro diário de movimentações de estoque, consumo de insumos e consulta ao catálogo.',
        LIDER: 'Perfil de Liderança: Gestão de fichas técnicas, controle de validade de lotes, transferências e emissão de laudos.',
        ADMIN: 'Perfil Administrador: Acesso irrestrito a configurações, parametrizações do sistema, gestão de equipe e relatórios de auditoria.'
    };

    // Atualiza caixa informativa de permissão ao selecionar o cargo
    if (selectNivelAcesso) {
        selectNivelAcesso.addEventListener('change', () => {
            const nivel = selectNivelAcesso.value;
            if (descricoesCargos[nivel] && painelInfoPermissao && textoPermissao) {
                textoPermissao.textContent = descricoesCargos[nivel];
                painelInfoPermissao.classList.remove('d-none');
            } else if (painelInfoPermissao) {
                painelInfoPermissao.classList.add('d-none');
            }
        });
    }

    function exibirAlerta(mensagem, tipo = 'danger') {
        if (!avisoCadastro) return;
        avisoCadastro.className = `alert alert-${tipo} mb-3 auth-step`;
        avisoCadastro.textContent = mensagem;
        avisoCadastro.classList.remove('d-none');
    }

    function esconderAlerta() {
        if (!avisoCadastro) return;
        avisoCadastro.classList.add('d-none');
        avisoCadastro.textContent = '';
    }

    if (formCadastro) {
        formCadastro.addEventListener('submit', async (e) => {
            e.preventDefault();
            esconderAlerta();

            const nome = document.getElementById('nome')?.value.trim() || '';
            const email = document.getElementById('email')?.value.trim() || '';
            const cpf = document.getElementById('cpf')?.value.trim() || '';
            const telefone = document.getElementById('telefone')?.value.trim() || '';
            const senha = document.getElementById('senha')?.value.trim() || '';
            const cargo = selectNivelAcesso?.value || '';

            // Validações básicas
            if (!nome || !email || !cpf || !senha || !cargo) {
                exibirAlerta('Por favor, preencha todos os campos obrigatórios (*).');
                return;
            }

            if (senha.length < 6) {
                exibirAlerta('A senha inicial deve possuir no mínimo 6 caracteres.');
                return;
            }

            const textoOriginal = btnCadastrar ? btnCadastrar.innerHTML : 'Cadastrar';
            if (btnCadastrar) {
                btnCadastrar.disabled = true;
                btnCadastrar.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Cadastrando...';
            }

            try {
                // Mapeia perfil selecionado para o ID de cargo correspondente no banco
                const cargoMap = {
                    'ADMIN': 1,
                    'LIDER': 2,
                    'OPERADOR': 3
                };
                const id_cargo = cargoMap[cargo] || 3;

                // Requisição à API de Funcionários
                const res = await Docisis.api('/funcionarios', {
                    method: 'POST',
                    body: {
                        nome,
                        email,
                        cpf: cpf.replace(/\D/g, ''),
                        telefone: telefone.replace(/\D/g, ''),
                        senha,
                        id_cargo,
                        cargo
                    }
                });

                if (res.ok) {
                    exibirAlerta('Solicitação de cadastro realizada com sucesso! Redirecionando para login...', 'success');
                    formCadastro.reset();
                    if (painelInfoPermissao) painelInfoPermissao.classList.add('d-none');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1800);
                } else {
                    if (res.status === 0) {
                        console.warn('[Docisis Cadastro] Backend offline.');
                        exibirAlerta('Servidor temporariamente indisponível. Verifique se o backend está em execução.');
                    } else {
                        exibirAlerta(res.error || 'Não foi possível concluir o cadastro. Verifique os dados informados.');
                    }
                }
            } catch (err) {
                exibirAlerta('Erro inesperado ao processar solicitação de cadastro.');
            } finally {
                if (btnCadastrar) {
                    btnCadastrar.disabled = false;
                    btnCadastrar.innerHTML = textoOriginal;
                }
            }
        });
    }
});
