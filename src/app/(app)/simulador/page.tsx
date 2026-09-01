import { SimuladorCompra } from "@/components/simulador-compra";
import {
  getSaudeFinanceira,
  getCategories,
  materializeRecurring,
} from "@/lib/queries";

export default async function SimuladorPage() {
  const now = new Date();
  await materializeRecurring(now.getMonth() + 1, now.getFullYear());

  const [snapshot, categorias] = await Promise.all([
    getSaudeFinanceira(),
    getCategories("despesa"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Posso comprar?</h1>
        <p className="text-muted-foreground">
          Simule uma compra e veja, na hora, se ela é saudável para o seu mês.
        </p>
      </div>

      <SimuladorCompra
        snapshot={snapshot}
        categorias={categorias.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
