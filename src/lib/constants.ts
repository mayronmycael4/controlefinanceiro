export const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

export const ACCOUNT_TYPES = [
  { value: "carteira", label: "Carteira" },
  { value: "corrente", label: "Conta Corrente" },
  { value: "poupanca", label: "Poupança" },
] as const;

export const CARD_BRANDS = ["Visa", "Mastercard", "Elo", "American Express", "Outro"];

export const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function accountTypeLabel(type: string) {
  return ACCOUNT_TYPES.find((t) => t.value === type)?.label ?? type;
}

export const FREQUENCIAS = [
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
] as const;

// Frequências para "Repetir N vezes" (conta/receita)
export const FREQUENCIAS_REPETICAO = FREQUENCIAS;

export function freqRepeticaoLabel(v: string) {
  return FREQUENCIAS_REPETICAO.find((f) => f.value === v)?.label ?? v;
}

// 0 = domingo ... 6 = sábado (compatível com Date.getDay())
export const DIAS_SEMANA = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export function frequenciaLabel(freq: string) {
  return FREQUENCIAS.find((f) => f.value === freq)?.label ?? freq;
}

// Texto do agendamento de uma recorrente
export function recorrenteQuando(r: {
  frequency: string;
  dayOfMonth: number;
  dayOfWeek: number | null;
  month: number | null;
}): string {
  if (r.frequency === "semanal") {
    return `Toda ${DIAS_SEMANA[r.dayOfWeek ?? 0].toLowerCase()}`;
  }
  if (r.frequency === "quinzenal") {
    const d2 = Math.min(r.dayOfMonth + 15, 31);
    return `Dias ${r.dayOfMonth} e ${d2} de cada mês`;
  }
  if (r.frequency === "anual") {
    return `Todo ${r.dayOfMonth} de ${MESES[(r.month ?? 1) - 1].toLowerCase()}`;
  }
  if (r.frequency === "trimestral" || r.frequency === "semestral") {
    const passo = r.frequency === "trimestral" ? 3 : 6;
    return `Dia ${r.dayOfMonth}, a cada ${passo} meses (a partir de ${MESES[(r.month ?? 1) - 1].toLowerCase()})`;
  }
  return `Todo dia ${r.dayOfMonth}`;
}
