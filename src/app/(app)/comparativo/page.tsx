import { TrendingUp, TrendingDown, Minus } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CategoriaEvolucaoLine } from "@/components/charts";
import { ComparativoControles } from "@/components/comparativo-controles";
import {
  getAvailableYears,
  getCategoriaEvolucao,
  getComparativoMeses,
  materializeRecurring,
} from "@/lib/queries";
import { formatBRL } from "@/lib/format";
import { MESES } from "@/lib/constants";
import { cn } from "@/lib/utils";

function parseMesKey(v: string | undefined, fb: { month: number; year: number }) {
  if (v && /^\d{4}-\d{2}$/.test(v)) {
    const [y, m] = v.split("-").map(Number);
    return { month: m, year: y };
  }
  return fb;
}

export default async function ComparativoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const now = new Date();
  await materializeRecurring(now.getMonth() + 1, now.getFullYear());

  const kind = one(sp.kind) === "receita" ? "receita" : "despesa";
  const year = parseInt(one(sp.year) ?? "", 10) || now.getFullYear();
  const mesAtual = { month: now.getMonth() + 1, year: now.getFullYear() };
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const mesAnt = { month: prev.getMonth() + 1, year: prev.getFullYear() };
  const a = parseMesKey(one(sp.ma), mesAnt);
  const b = parseMesKey(one(sp.mb), mesAtual);

  const [anos, evol, comp] = await Promise.all([
    getAvailableYears(),
    getCategoriaEvolucao(year, kind),
    getComparativoMeses(a, b, kind),
  ]);
  const anosSel = anos.includes(year) ? anos : [...anos, year].sort((x, y) => y - x);

  // Opções de mês para os seletores (todos os meses dos anos disponíveis, desc)
  const mesesOpts: string[] = [];
  for (const y of anosSel)
    for (let m = 12; m >= 1; m--)
      mesesOpts.push(`${y}-${String(m).padStart(2, "0")}`);

  const totalA = comp.reduce((s, l) => s + l.valorA, 0);
  const totalB = comp.reduce((s, l) => s + l.valorB, 0);
  const labelMes = (x: { month: number; year: number }) =>
    `${MESES[x.month - 1]}/${x.year}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Comparativo</h1>
        <p className="text-muted-foreground">
          Evolução das categorias no ano e comparação entre dois meses.
        </p>
      </div>

      <Card>
        <CardContent className="py-4">
          <ComparativoControles anos={anosSel} meses={mesesOpts} />
        </CardContent>
      </Card>

      <CategoriaEvolucaoLine
        meses={evol.meses}
        series={evol.series}
        title={`Evolução por categoria — ${kind === "receita" ? "Receitas" : "Despesas"} ${year}`}
        description="Top 8 categorias, mês a mês (pago + pendente)"
      />

      <Card>
        <CardHeader>
          <CardTitle>
            {labelMes(a)} vs {labelMes(b)}
          </CardTitle>
          <CardDescription>
            Diferença por categoria ({kind === "receita" ? "receitas" : "despesas"}).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {comp.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
              Sem dados nesses meses.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-2 text-left font-medium">Categoria</th>
                    <th className="py-2 text-right font-medium">{labelMes(a)}</th>
                    <th className="py-2 text-right font-medium">{labelMes(b)}</th>
                    <th className="py-2 text-right font-medium">Variação</th>
                  </tr>
                </thead>
                <tbody>
                  {comp.map((l) => (
                    <tr key={l.nome} className="border-b last:border-0">
                      <td className="py-2">
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: l.fill }}
                          />
                          {l.nome}
                        </span>
                      </td>
                      <td className="py-2 text-right font-mono text-muted-foreground">
                        {formatBRL(l.valorA)}
                      </td>
                      <td className="py-2 text-right font-mono">{formatBRL(l.valorB)}</td>
                      <td className="py-2 text-right">
                        <Variacao pct={l.variacao} kind={kind} />
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t font-semibold">
                    <td className="py-2">Total</td>
                    <td className="py-2 text-right font-mono">{formatBRL(totalA)}</td>
                    <td className="py-2 text-right font-mono">{formatBRL(totalB)}</td>
                    <td className="py-2 text-right">
                      <Variacao
                        pct={totalA > 0 ? ((totalB - totalA) / totalA) * 100 : null}
                        kind={kind}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Variacao({ pct, kind }: { pct: number | null; kind: string }) {
  if (pct === null)
    return <span className="text-muted-foreground">novo</span>;
  const zero = Math.abs(pct) < 0.5;
  const subiu = pct > 0;
  // Despesa subindo = ruim (vermelho); receita subindo = bom (verde)
  const ruim = kind === "despesa" ? subiu : !subiu;
  const Icon = zero ? Minus : subiu ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-end gap-1 font-medium tabular-nums",
        zero
          ? "text-muted-foreground"
          : ruim
            ? "text-destructive"
            : "text-emerald-600 dark:text-emerald-500"
      )}
    >
      <Icon className="size-3.5" />
      {subiu ? "+" : ""}
      {pct.toFixed(0)}%
    </span>
  );
}
