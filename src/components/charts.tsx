"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatBRL, formatBRLCompact } from "@/lib/format";

export type Grupo = { nome: string; valor: number; fill: string };

function configFrom(data: Grupo[]): ChartConfig {
  return Object.fromEntries(
    data.map((d) => [d.nome, { label: d.nome, color: d.fill }])
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

// ---- Donut genérico (categoria / conta / cartão) ----
export function DonutChart({
  title,
  description,
  data,
  className,
}: {
  title: string;
  description?: string;
  data: Grupo[];
  className?: string;
}) {
  const total = data.reduce((s, d) => s + d.valor, 0);
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState label="Sem dados no período." />
        ) : (
          <ChartContainer
            config={configFrom(data)}
            className="mx-auto aspect-square max-h-[280px]"
          >
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, name) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">{name}</span>
                        <span className="font-mono font-medium">
                          {formatBRL(Number(value))}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Pie
                data={data}
                dataKey="valor"
                nameKey="nome"
                innerRadius={62}
                strokeWidth={4}
              >
                {data.map((d) => (
                  <Cell key={d.nome} fill={d.fill} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-lg font-bold"
                          >
                            {formatBRLCompact(total)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 20}
                            className="fill-muted-foreground text-xs"
                          >
                            Total
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
              <ChartLegend
                content={<ChartLegendContent nameKey="nome" />}
                className="flex-wrap gap-2"
              />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ---- Barras Receitas x Despesas por mês ----
const fluxoConfig = {
  receitas: { label: "Receitas", color: "var(--color-chart-2)" },
  despesas: { label: "Despesas", color: "var(--color-chart-1)" },
} satisfies ChartConfig;

type FluxoRow = { mes: string; receitas: number; despesas: number };

export function FluxoBar({
  data,
  title = "Receitas x Despesas",
  description = "Comparativo mensal (pagos)",
  className,
}: {
  data: FluxoRow[];
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={fluxoConfig} className="h-[300px] w-full">
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="mes" tickLine={false} tickMargin={10} axisLine={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={60}
              tickFormatter={(v) => formatBRLCompact(Number(v))}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">
                        {fluxoConfig[name as keyof typeof fluxoConfig]?.label}
                      </span>
                      <span className="font-mono font-medium">
                        {formatBRL(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="receitas" fill="var(--color-receitas)" radius={4} />
            <Bar dataKey="despesas" fill="var(--color-despesas)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ---- Área do saldo acumulado ----
const saldoConfig = {
  saldo: { label: "Realizado", color: "var(--color-chart-3)" },
  previsto: { label: "Previsto (c/ pendentes)", color: "var(--color-chart-4)" },
} satisfies ChartConfig;

export function SaldoArea({
  data,
  className,
}: {
  data: { mes: string; saldo: number; previsto?: number }[];
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Evolução do Saldo</CardTitle>
        <CardDescription>
          Saldo realizado (pago) e projeção com os pendentes (tracejado)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={saldoConfig} className="h-[280px] w-full">
          <AreaChart accessibilityLayer data={data}>
            <defs>
              <linearGradient id="fillSaldo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-saldo)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-saldo)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="mes" tickLine={false} tickMargin={10} axisLine={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={60}
              tickFormatter={(v) => formatBRLCompact(Number(v))}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">
                        {saldoConfig[name as keyof typeof saldoConfig]?.label}
                      </span>
                      <span className="font-mono font-medium">
                        {formatBRL(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              dataKey="saldo"
              type="monotone"
              fill="url(#fillSaldo)"
              stroke="var(--color-saldo)"
              strokeWidth={2}
            />
            <Line
              dataKey="previsto"
              type="monotone"
              stroke="var(--color-previsto)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ---- Evolução mensal por categoria (multi-linha) ----
export function CategoriaEvolucaoLine({
  meses,
  series,
  title = "Evolução por categoria",
  description = "Gasto de cada categoria mês a mês",
}: {
  meses: string[];
  series: { nome: string; fill: string; valores: number[] }[];
  title?: string;
  description?: string;
}) {
  const top = series.slice(0, 8);
  const data = meses.map((mes, i) => {
    const row: Record<string, number | string> = { mes };
    for (const s of top) row[s.nome] = s.valores[i];
    return row;
  });
  const config: ChartConfig = Object.fromEntries(
    top.map((s) => [s.nome, { label: s.nome, color: s.fill }])
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {top.length === 0 ? (
          <EmptyState label="Sem dados no ano." />
        ) : (
          <ChartContainer config={config} className="h-[320px] w-full">
            <LineChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="mes" tickLine={false} tickMargin={10} axisLine={false} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={60}
                tickFormatter={(v) => formatBRLCompact(Number(v))}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">{name}</span>
                        <span className="font-mono font-medium">
                          {formatBRL(Number(value))}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} className="flex-wrap gap-2" />
              {top.map((s) => (
                <Line
                  key={s.nome}
                  dataKey={s.nome}
                  type="monotone"
                  stroke={s.fill}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ---- Linha de tendência ----
export function TendenciaLine({ data }: { data: FluxoRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendência de Receitas x Despesas</CardTitle>
        <CardDescription>Linha do tempo do ano (pagos)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={fluxoConfig} className="h-[300px] w-full">
          <LineChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="mes" tickLine={false} tickMargin={10} axisLine={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={60}
              tickFormatter={(v) => formatBRLCompact(Number(v))}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">
                        {fluxoConfig[name as keyof typeof fluxoConfig]?.label}
                      </span>
                      <span className="font-mono font-medium">
                        {formatBRL(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Line dataKey="receitas" type="monotone" stroke="var(--color-receitas)" strokeWidth={2} dot={false} />
            <Line dataKey="despesas" type="monotone" stroke="var(--color-despesas)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
