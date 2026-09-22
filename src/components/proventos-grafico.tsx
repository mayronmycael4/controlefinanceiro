"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatBRL } from "@/lib/format";

export function ProventosGrafico({ data }: { data: Array<{ mes: string; valor: number }> }) {
  return (
    <ChartContainer className="h-[260px] w-full" config={{ valor: { label: "Recebido", color: "hsl(var(--chart-1))" } }}>
      <BarChart accessibilityLayer data={data} margin={{ left: 8, right: 8, top: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value}`} width={58} />
        <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatBRL(Number(value))} />} />
        <Bar dataKey="valor" fill="var(--color-valor)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
