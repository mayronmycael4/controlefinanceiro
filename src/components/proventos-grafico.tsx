"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatBRL } from "@/lib/format";

type MonthlyPoint = { mes: string; valor: number };
type AnnualPoint = { ano: string; valor: number; crescimento: number | null };

const chartConfig = { valor: { label: "Proventos", color: "var(--color-chart-2)" } };

function EmptyChart({ label }: { label: string }) {
  return <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">{label}</div>;
}

export function ProventosGrafico({ data }: { data: MonthlyPoint[] }) {
  if (!data.some((item) => item.valor > 0)) return <EmptyChart label="Ainda não há proventos recebidos neste período." />;
  return (
    <ChartContainer className="h-[260px] w-full" config={chartConfig}>
      <BarChart accessibilityLayer data={data} margin={{ left: 8, right: 8, top: 18 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value}`} width={58} />
        <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatBRL(Number(value))} />} />
        <Bar dataKey="valor" fill="var(--color-valor)" radius={[5, 5, 0, 0]} maxBarSize={54}>
          <LabelList dataKey="valor" position="top" formatter={(value) => Number(value ?? 0) > 0 ? formatBRL(Number(value)) : ""} className="fill-muted-foreground text-[10px]" />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

export function CrescimentoAnualGrafico({ data }: { data: AnnualPoint[] }) {
  if (!data.length) return <EmptyChart label="Os dados anuais aparecerão após o primeiro provento recebido." />;
  return (
    <ChartContainer className="h-[260px] w-full" config={chartConfig}>
      <BarChart accessibilityLayer data={data} margin={{ left: 8, right: 8, top: 18 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="ano" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value}`} width={58} />
        <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatBRL(Number(value))} labelFormatter={(label) => `Ano ${label}`} />} />
        <Bar dataKey="valor" radius={[5, 5, 0, 0]} maxBarSize={80}>
          {data.map((item) => <Cell key={item.ano} fill={item.crescimento !== null && item.crescimento < 0 ? "var(--destructive)" : "var(--color-valor)"} />)}
          <LabelList dataKey="crescimento" position="top" formatter={(value) => value == null ? "" : `${Number(value) >= 0 ? "+" : ""}${Number(value).toFixed(1)}%`} className="fill-muted-foreground text-[10px]" />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
