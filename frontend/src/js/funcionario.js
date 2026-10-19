/**
 * DOCISIS - MÓDULO DE PERFIL DO FUNCIONÁRIO (FUNCIONARIO.JS)
 * Gestão de dados pessoais, foto de perfil, senha e notificações
 */

document.addEventListener('DOMContentLoaded', () => {
    // Alerta de feedback
    const avisoPerfil = document.getElementById('aviso-perfil');

    // Formulários
    const formPerfil = document.getElementById('form-perfil-funcionario');
    const formSeguranca = document.getElementById('form-seguranca-senha');
    const btnSalvarNotif = document.getElementById('btn-salvar-notif');

    // Campos de Perfil
    const perfilNome = document.getElementById('perfil-nome');
    const perfilEmail = document.getElementById('perfil-email');
    const perfilTelefone = document.getElementById('perfil-telefone');
    const perfilCargo = document.getElementById('perfil-cargo');

    // Foto de Perfil
    const fotoInput = document.getElementById('foto-input');
    const avatarPreviewBox = document.getElementById('avatar-preview-box');
    const avatarImgPreview = document.getElementById('avatar-img-preview');
    const defaultAvatarIcon = document.querySelector('.default-avatar-icon');
    const btnAlterarFoto = document.getElementById('btn-alterar-foto');

    // Campos de Notificação
    const notifEmail = document.getElementById('notif-email');
    const notifSms = document.getElementById('notif-sms');
    const notifRelatorio = document.getElementById('notif-relatorio');

    function exibirFeedback(mensagem, tipo = 'success') {
        if (avisoPerfil) {
            avisoPerfil.className = `alert alert-${tipo} mb-4 auth-step`;
            avisoPerfil.textContent = mensagem;
            avisoPerfil.classList.remove('d-none');
            avisoPerfil.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            setTimeout(() => {
                avisoPerfil.classList.add('d-none');
            }, 4500);
        }
        Docisis.showToast(mensagem, tipo === 'success' ? 'sucesso' : 'erro');
    }

    /**
     * Carrega dados do usuário atual nos campos
     */
    function carregarDadosUsuario() {
        const user = Docisis.getUser() || {
            nome: 'Heloisa Paixão',
            email: 'heloisa.paixao@docisis.com.br',
            telefone: '(11) 98765-4321',
            cargo: 'Chef Confeiteira / Administradora'
        };

        if (perfilNome) perfilNome.value = user.nome || '';
        if (perfilEmail) perfilEmail.value = user.email || '';
        if (perfilTelefone) perfilTelefone.value = user.telefone || '';
        if (perfilCargo) perfilCargo.value = user.cargo || '';

        // Carrega foto salva em localStorage se existir
        const fotoSalva = localStorage.getItem('docisis_user_photo');
        if (fotoSalva && avatarImgPreview) {
            avatarImgPreview.src = fotoSalva;
            avatarImgPreview.classList.remove('d-none');
            if (defaultAvatarIcon) defaultAvatarIcon.classList.add('d-none');
        }

        // Carrega preferências de notificação
        try {
            const prefs = JSON.parse(localStorage.getItem('docisis_notif_prefs') || '{}');
            if (notifEmail && prefs.email !== undefined) notifEmail.checked = prefs.email;
            if (notifSms && prefs.sms !== undefined) notifSms.checked = prefs.sms;
            if (notifRelatorio && prefs.relatorio !== undefined) notifRelatorio.checked = prefs.relatorio;
        } catch {}
    }

    // Ações de Foto de Perfil
    function abrirSeletorFoto() {
        if (fotoInput) fotoInput.click();
    }

    if (avatarPreviewBox) {
        avatarPreviewBox.addEventListener('click', abrirSeletorFoto);
        avatarPreviewBox.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                abrirSeletorFoto();
            }
        });
    }

    if (btnAlterarFoto) {
        btnAlterarFoto.addEventListener('click', abrirSeletorFoto);
    }

    if (fotoInput) {
        fotoInput.addEventListener('change', () => {
            const file = fotoInput.files && fotoInput.files[0];
            if (file) {
                if (!file.type.startsWith('image/')) {
                    exibirFeedback('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP).', 'danger');
                    return;
                }
                const reader = new FileReader();
                reader.onload = (e) => {
                    const base64 = e.target.result;
                    if (avatarImgPreview) {
                        avatarImgPreview.src = base64;
                        avatarImgPreview.classList.remove('d-none');
                    }
                    if (defaultAvatarIcon) {
                        defaultAvatarIcon.classList.add('d-none');
                    }
                    localStorage.setItem('docisis_user_photo', base64);
                    exibirFeedback('Foto de perfil atualizada com sucesso!', 'success');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Submissão do Formulário de Dados Pessoais
    if (formPerfil) {
        formPerfil.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nome = perfilNome?.value.trim() || '';
            const email = perfilEmail?.value.trim() || '';
            const telefone = perfilTelefone?.value.trim() || '';
            const cargo = perfilCargo?.value.trim() || '';

            if (!nome || !email) {
                exibirFeedback('Nome e e-mail são obrigatórios.', 'danger');
                return;
            }

            const btnSalvar = document.getElementById('btn-salvar-perfil');
            const textoOriginal = btnSalvar ? btnSalvar.innerHTML : 'Salvar';
            if (btnSalvar) {
                btnSalvar.disabled = true;
                btnSalvar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';
            }

            // Atualiza objeto em sessão
            const userAtual = Docisis.getUser() || {};
            const userAtualizado = {
                ...userAtual,
                nome,
                email,
                telefone,
                cargo
            };
            Docisis.setUser(userAtualizado);

            // Chamada à API se ID disponível
            if (userAtual.id) {
                await Docisis.api(`/funcionarios/${userAtual.id}`, {
                    method: 'PUT',
                    body: { nome, email, telefone, cargo }
                });
            }

            Docisis.initTopbar();
            exibirFeedback('Dados do perfil salvos com sucesso!', 'success');

            if (btnSalvar) {
                btnSalvar.disabled = false;
                btnSalvar.innerHTML = textoOriginal;
            }
        });
    }

    // Submissão de Alteração de Senha
    if (formSeguranca) {
        formSeguranca.addEventListener('submit', async (e) => {
            e.preventDefault();

            const senhaAtual = document.getElementById('senha-atual')?.value || '';
            const senhaNova = document.getElementById('senha-nova')?.value || '';
            const senhaConfirma = document.getElementById('senha-confirma')?.value || '';

            if (!senhaAtual || !senhaNova || !senhaConfirma) {
                exibirFeedback('Preencha todos os campos de senha.', 'danger');
                return;
            }

            if (senhaNova.length < 6) {
                exibirFeedback('A nova senha deve ter no mínimo 6 caracteres.', 'danger');
                return;
            }

            if (senhaNova !== senhaConfirma) {
                exibirFeedback('A confirmação da nova senha não coincide.', 'danger');
                return;
            }

            // Simula / envia alteração de senha
            exibirFeedback('Senha de acesso atualizada com sucesso!', 'success');
            formSeguranca.reset();
        });
    }

    // Salvamento de Preferências de Notificação
    if (btnSalvarNotif) {
        btnSalvarNotif.addEventListener('click', () => {
            const prefs = {
                email: notifEmail ? notifEmail.checked : true,
                sms: notifSms ? notifSms.checked : false,
                relatorio: notifRelatorio ? notifRelatorio.checked : true
            };
            localStorage.setItem('docisis_notif_prefs', JSON.stringify(prefs));
            exibirFeedback('Preferências de notificação salvas!', 'success');
        });
    }

    carregarDadosUsuario();
});
