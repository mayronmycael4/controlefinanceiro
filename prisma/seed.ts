import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const CHART = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

async function main() {
  // Limpa (ordem por causa das FKs)
  await db.transaction.deleteMany();
  await db.budget.deleteMany();
  await db.category.deleteMany();
  await db.account.deleteMany();
  await db.creditCard.deleteMany();

  // Contas / carteiras
  const [carteira, corrente, poupanca] = await Promise.all([
    db.account.create({ data: { name: "Carteira", type: "carteira", color: CHART[0], initialBalance: 850 } }),
    db.account.create({ data: { name: "Conta Corrente — Nubank", type: "corrente", color: CHART[1], initialBalance: 12400 } }),
    db.account.create({ data: { name: "Poupança", type: "poupanca", color: CHART[2], initialBalance: 30000 } }),
  ]);

  // Cartões de crédito
  const [visa, master] = await Promise.all([
    db.creditCard.create({ data: { name: "Visa Infinite", brand: "Visa", limit: 15000, closingDay: 3, dueDay: 10, color: CHART[3] } }),
    db.creditCard.create({ data: { name: "Mastercard Black", brand: "Mastercard", limit: 20000, closingDay: 20, dueDay: 28, color: CHART[4] } }),
  ]);

  // Categorias de despesa
  const catDesp = await Promise.all(
    [
      ["Moradia", CHART[0]],
      ["Alimentação", CHART[1]],
      ["Transporte", CHART[2]],
      ["Lazer", CHART[3]],
      ["Saúde", CHART[4]],
      ["Outros", CHART[0]],
    ].map(([name, color]) =>
      db.category.create({ data: { name, kind: "despesa", color } })
    )
  );
  // Categorias de receita
  const catRec = await Promise.all(
    [
      ["Salário", CHART[1]],
      ["Freelance", CHART[2]],
      ["Investimentos", CHART[3]],
    ].map(([name, color]) =>
      db.category.create({ data: { name, kind: "receita", color } })
    )
  );

  const byName = (arr: { id: string; name: string }[], n: string) =>
    arr.find((c) => c.name === n)!.id;

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-based
  const d = (day: number) => new Date(y, m, day);

  const txs: Array<{
    description: string;
    amount: number;
    kind: string;
    status: string;
    date: Date;
    categoryId: string;
    accountId?: string;
    creditCardId?: string;
  }> = [
    { description: "Salário — Empresa XYZ", amount: 14500, kind: "receita", status: "pago", date: d(5), categoryId: byName(catRec, "Salário"), accountId: corrente.id },
    { description: "Freelance — Projeto Web", amount: 4800, kind: "receita", status: "pago", date: d(9), categoryId: byName(catRec, "Freelance"), accountId: corrente.id },
    { description: "Dividendos — Ações", amount: 2100, kind: "receita", status: "pago", date: d(12), categoryId: byName(catRec, "Investimentos"), accountId: poupanca.id },
    { description: "Reembolso pendente", amount: 900, kind: "receita", status: "pendente", date: d(24), categoryId: byName(catRec, "Freelance"), accountId: corrente.id },

    { description: "Aluguel apartamento", amount: 3200, kind: "despesa", status: "pago", date: d(6), categoryId: byName(catDesp, "Moradia"), accountId: corrente.id },
    { description: "Supermercado Pão de Açúcar", amount: 842.35, kind: "despesa", status: "pago", date: d(7), categoryId: byName(catDesp, "Alimentação"), creditCardId: master.id },
    { description: "Conta de energia", amount: 318.9, kind: "despesa", status: "pago", date: d(8), categoryId: byName(catDesp, "Moradia"), accountId: corrente.id },
    { description: "Uber / transporte", amount: 156.4, kind: "despesa", status: "pago", date: d(10), categoryId: byName(catDesp, "Transporte"), creditCardId: visa.id },
    { description: "Netflix + Spotify", amount: 89.8, kind: "despesa", status: "pago", date: d(11), categoryId: byName(catDesp, "Lazer"), creditCardId: visa.id },
    { description: "Restaurante — jantar", amount: 234.5, kind: "despesa", status: "pago", date: d(13), categoryId: byName(catDesp, "Alimentação"), creditCardId: master.id },
    { description: "Plano de saúde", amount: 589, kind: "despesa", status: "pendente", date: d(15), categoryId: byName(catDesp, "Saúde"), accountId: corrente.id },
    { description: "Combustível", amount: 280, kind: "despesa", status: "pago", date: d(16), categoryId: byName(catDesp, "Transporte"), creditCardId: visa.id },
    { description: "Academia mensalidade", amount: 149.9, kind: "despesa", status: "pendente", date: d(17), categoryId: byName(catDesp, "Saúde"), accountId: carteira.id },
    { description: "Cinema", amount: 96, kind: "despesa", status: "pago", date: d(18), categoryId: byName(catDesp, "Lazer"), creditCardId: master.id },
    { description: "Farmácia", amount: 132.7, kind: "despesa", status: "pago", date: d(19), categoryId: byName(catDesp, "Saúde"), accountId: carteira.id },
  ];

  await db.transaction.createMany({ data: txs });

  // Orçamentos do mês atual (mês é 1-based no banco)
  await db.budget.createMany({
    data: [
      { amount: 12000, month: m + 1, year: y, categoryId: null }, // total
      { amount: 4000, month: m + 1, year: y, categoryId: byName(catDesp, "Moradia") },
      { amount: 2500, month: m + 1, year: y, categoryId: byName(catDesp, "Alimentação") },
      { amount: 800, month: m + 1, year: y, categoryId: byName(catDesp, "Transporte") },
      { amount: 1000, month: m + 1, year: y, categoryId: byName(catDesp, "Lazer") },
    ],
  });

  console.log("Seed concluído:", {
    contas: 3,
    cartoes: 2,
    categorias: catDesp.length + catRec.length,
    transacoes: txs.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
