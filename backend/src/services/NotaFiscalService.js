const fs = require("fs");
const path = require("path");
const NotaFiscalRepository = require("../repositories/NotaFiscalRepository");
const { validarMagicBytes } = require("../utils/fileValidator");

const removerArquivoTemp = (file) => {
  if (file?.path && fs.existsSync(file.path)) {
    try {
      fs.unlinkSync(file.path);
    } catch (err) {
      console.error(`Erro ao remover arquivo temporário ${file.path}:`, err);
    }
  }
};

const removerArquivoDoDisco = (caminhoRelativo) => {
  if (!caminhoRelativo) return;

  const nomeArquivo = path.basename(caminhoRelativo);
  const caminhoAbsoluto = path.join(
    __dirname,
    "../../public/uploads/notas_fiscais",
    nomeArquivo,
  );

  if (fs.existsSync(caminhoAbsoluto)) {
    try {
      fs.unlinkSync(caminhoAbsoluto);
    } catch (erro) {
      console.error(
        `Erro ao remover anexo da nota fiscal: ${nomeArquivo}`,
        erro,
      );
    }
  }
};

class NotaFiscalService {
  async listarNotas(queryParams = {}) {
    const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
    const limit = Math.max(
      1,
      Math.min(100, parseInt(queryParams.limit, 10) || 10),
    );

    const resultado = await NotaFiscalRepository.findAll({
      ...queryParams,
      page,
      limit,
    });

    return {
      sucesso: true,
      ...resultado,
    };
  }

  async buscarNotaPorId(id) {
    const idNum = Number(id);
    if (!id || !Number.isInteger(idNum) || idNum <= 0) {
      throw { status: 400, mensagem: "ID de nota fiscal inválido" };
    }

    const nota = await NotaFiscalRepository.findById(idNum);
    if (!nota) {
      throw { status: 404, mensagem: "Nota fiscal não encontrada" };
    }

    return {
      sucesso: true,
      dados: nota,
    };
  }

  async cadastrarNota(dados) {
    const { file } = dados;

    try {
      if (file && !validarMagicBytes(file.path, ["pdf", "jpeg", "png", "jpg"])) {
        throw {
          status: 400,
          mensagem:
            "Arquivo inválido ou corrompido: o conteúdo real não corresponde a um documento válido (PDF, JPEG ou PNG).",
        };
      }

      const { fornecedor, quantidade, dt_compra } = dados;

      if (!fornecedor || quantidade === undefined || quantidade === null || quantidade === "") {
        throw {
          status: 400,
          mensagem: "Os campos fornecedor e quantidade são obrigatórios",
        };
      }

      const qtdNum = Number(quantidade);
      if (!Number.isInteger(qtdNum) || qtdNum <= 0) {
        throw {
          status: 400,
          mensagem: "A quantidade deve ser um número inteiro positivo",
        };
      }

      const novaNota = {
        dt_compra: dt_compra || new Date(),
        fornecedor: fornecedor.trim(),
        quantidade: qtdNum,
        arquivo: file ? `/public/uploads/notas_fiscais/${file.filename}` : null,
      };

      const id = await NotaFiscalRepository.create(novaNota);

      return {
        sucesso: true,
        mensagem: "Nota fiscal cadastrada com sucesso",
        id,
      };
    } catch (erro) {
      removerArquivoTemp(file);
      throw erro;
    }
  }

  async atualizarNota(id, dados) {
    const { file } = dados;

    try {
      if (file && !validarMagicBytes(file.path, ["pdf", "jpeg", "png", "jpg"])) {
        throw {
          status: 400,
          mensagem:
            "Arquivo inválido ou corrompido: o conteúdo real não corresponde a um documento válido (PDF, JPEG ou PNG).",
        };
      }

      const idNum = Number(id);
      if (!id || !Number.isInteger(idNum) || idNum <= 0) {
        throw { status: 400, mensagem: "ID de nota fiscal inválido" };
      }

      const existe = await NotaFiscalRepository.findById(idNum);
      if (!existe) {
        throw { status: 404, mensagem: "Nota fiscal não encontrada" };
      }

      const atualizado = {};

      if (dados.fornecedor !== undefined)
        atualizado.fornecedor = dados.fornecedor.trim();

      if (dados.quantidade !== undefined) {
        const qtdNum = Number(dados.quantidade);
        if (!Number.isInteger(qtdNum) || qtdNum <= 0) {
          throw {
            status: 400,
            mensagem: "A quantidade deve ser um número inteiro positivo",
          };
        }
        atualizado.quantidade = qtdNum;
      }

      if (dados.dt_compra !== undefined) atualizado.dt_compra = dados.dt_compra;

      if (file) {
        atualizado.arquivo = `/public/uploads/notas_fiscais/${file.filename}`;
      }

      if (Object.keys(atualizado).length === 0) {
        throw {
          status: 400,
          mensagem: "Nenhum dado válido enviado para atualização",
        };
      }

      await NotaFiscalRepository.update(idNum, atualizado);

      if (file && existe.arquivo) {
        removerArquivoDoDisco(existe.arquivo);
      }

      return {
        sucesso: true,
        mensagem: "Nota fiscal atualizada com sucesso",
      };
    } catch (erro) {
      removerArquivoTemp(file);
      throw erro;
    }
  }

  async deletarNota(id) {
    const idNum = Number(id);
    if (!id || !Number.isInteger(idNum) || idNum <= 0) {
      throw { status: 400, mensagem: "ID de nota fiscal inválido" };
    }

    const existe = await NotaFiscalRepository.findById(idNum);
    if (!existe) {
      throw { status: 404, mensagem: "Nota fiscal não encontrada" };
    }

    // Trava de integridade: checa se existem lotes vinculados à nota fiscal (Issue 9)
    const hasDeps = await NotaFiscalRepository.hasDependents(idNum);
    if (hasDeps) {
      throw {
        status: 409,
        mensagem:
          "Não é possível excluir a nota fiscal: existem lotes associados a ela.",
      };
    }

    if (existe.arquivo) {
      removerArquivoDoDisco(existe.arquivo);
    }

    await NotaFiscalRepository.delete(idNum);

    return {
      sucesso: true,
      mensagem: "Nota fiscal apagada com sucesso",
    };
  }
}

module.exports = new NotaFiscalService();
