const soDigitos = (v) => String(v ?? "").replace(/\D/g, "");

const idValido = (v) => Number.isInteger(Number(v)) && Number(v) > 0;

/** Converte número ou texto numérico em Number; qualquer outra coisa vira NaN. */
const numero = (v) =>
  typeof v === "number" || (typeof v === "string" && v.trim() !== "")
    ? Number(v)
    : NaN;

/** Confere os dígitos verificadores do CPF (aceita com ou sem pontuação). */
function cpfValido(cpf) {
  const d = soDigitos(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const digito = (n) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}

/** Padroniza o CPF como 000.000.000-00 (cabe no VARCHAR(14) do banco). */
const formatarCpf = (cpf) =>
  soDigitos(cpf).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

const emailValido = (e) =>
  typeof e === "string" &&
  e.length <= 150 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/** Telefone brasileiro com DDD: 10 ou 11 dígitos. */
const telefoneValido = (t) => [10, 11].includes(soDigitos(t).length);

/**
 * Lê "AAAA-MM-DD" ou "AAAA-MM-DD HH:MM[:SS]" (também com "T").
 * Devolve um Date (horário local) ou null se o formato ou a data forem inválidos
 * (ex.: 2027-13-45 ou 2026-02-30).
 */
function lerData(v) {
  if (typeof v !== "string") return null;
  const m =
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(
      v.trim(),
    );
  if (!m) return null;
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const [h, min, s] = [Number(m[4] || 0), Number(m[5] || 0), Number(m[6] || 0)];
  const d = new Date(ano, mes - 1, dia, h, min, s);
  // conferência de ida e volta: rejeita datas que o JavaScript "corrigiria" sozinho
  const confere =
    d.getFullYear() === ano &&
    d.getMonth() === mes - 1 &&
    d.getDate() === dia &&
    d.getHours() === h &&
    d.getMinutes() === min;
  return confere ? d : null;
}

module.exports = {
  idValido,
  numero,
  cpfValido,
  formatarCpf,
  emailValido,
  telefoneValido,
  lerData,
};
