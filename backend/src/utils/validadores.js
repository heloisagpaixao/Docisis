const soDigitos = (v) => String(v ?? "").replace(/\D/g, "");

const idValido = (v) => Number.isInteger(Number(v)) && Number(v) > 0;

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

module.exports = {
  idValido,
  cpfValido,
  formatarCpf,
  emailValido,
  telefoneValido,
};
