"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatBRL } from "@/lib/format";

type Event = { id: string; ticker: string; amount: number; date: Date; estimated?: boolean };

const monthConfig = {
  recebido: { label: "Recebido", color: "var(--color-chart-2)" },
  previsto: { label: "A receber / estimativa", color: "var(--color-chart-4)" },
};
const yearConfig = { valor: { label: "Total anual", color: "var(--color-chart-2)" } };
const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export function ProventosVisao({
  years,
  receivedEvents,
  futureEvents,
}: {
  years: number[];
  receivedEvents: Event[];
  futureEvents: Event[];
}) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [period, setPeriod] = useState<"month" | "year">("month");
  const monthlyYear = useMemo(() => Array.from({ length: 12 }, (_, index) => {
    const monthNumber = index + 1;
    const received = receivedEvents.filter((event) => event.date.getFullYear() === Number(year) && event.date.getMonth() === index).reduce((sum, event) => sum + event.amount, 0);
    const forecast = futureEvents.filter((event) => event.date.getFullYear() === Number(year) && event.date.getMonth() === index).reduce((sum, event) => sum + event.amount, 0);
    return { mes: monthNames[index].slice(0, 3), mesNumero: monthNumber, recebido: received, previsto: forecast };
  }), [receivedEvents, futureEvents, year]);
  const monthlyTotals = useMemo(() => monthlyYear.reduce((totals, point) => ({
    received: totals.received + point.recebido,
    forecast: totals.forecast + point.previsto,
  }), { received: 0, forecast: 0 }), [monthlyYear]);
  const annualSeries = useMemo(() => {
    const sums = new Map<number, { received: number; forecast: number }>();
    for (const event of [...receivedEvents, ...futureEvents]) {
      const value = sums.get(event.date.getFullYear()) ?? { received: 0, forecast: 0 };
      if (receivedEvents.some((received) => received.id === event.id)) value.received += event.amount;
      else value.forecast += event.amount;
      sums.set(event.date.getFullYear(), value);
    }
    const seriesYears = [...new Set([...years, ...sums.keys()])].sort((a, b) => a - b);
    return seriesYears.map((itemYear, index) => {
      const value = sums.get(itemYear) ?? { received: 0, forecast: 0 };
      const total = value.received + value.forecast;
      const previous = index > 0 ? sums.get(seriesYears[index - 1]) : undefined;
      const previousTotal = previous ? previous.received + previous.forecast : 0;
      return { ano: String(itemYear), valor: total, crescimento: previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : null, projetado: value.forecast > 0 };
    });
  }, [receivedEvents, futureEvents, years]);
  const selectedAnnual = annualSeries.find((item) => item.ano === year);
  const selectedMonth = Number(month);
  const receivedForSelection = receivedEvents.filter((event) => event.date.getFullYear() === Number(year) && (period === "year" || event.date.getMonth() + 1 === selectedMonth));
  const futureForSelection = futureEvents.filter((event) => event.date.getFullYear() === Number(year) && (period === "year" || event.date.getMonth() + 1 === selectedMonth));
  const receivedTotal = receivedForSelection.reduce((total, event) => total + event.amount, 0);
  const futureTotal = futureForSelection.reduce((total, event) => total + event.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle>Proventos no período</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {period === "month" && <Select value={month} onValueChange={setMonth}><SelectTrigger aria-label="Mês" className="w-36"><SelectValue /></SelectTrigger><SelectContent>{monthNames.map((name, index) => <SelectItem key={name} value={String(index + 1)}>{name}</SelectItem>)}</SelectContent></Select>}
            <Select value={year} onValueChange={setYear}><SelectTrigger aria-label="Ano" className="w-28"><SelectValue /></SelectTrigger><SelectContent>{years.map((item) => <SelectItem key={item} value={String(item)}>{item}</SelectItem>)}</SelectContent></Select>
            <Tabs value={period} onValueChange={(value) => setPeriod(value as "month" | "year")}><TabsList><TabsTrigger value="month">Mês</TabsTrigger><TabsTrigger value="year">Ano</TabsTrigger></TabsList></Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer data-privacy-chart="true" className="h-[320px] w-full" config={monthConfig}>
            <BarChart accessibilityLayer data={period === "month" ? monthlyYear : annualSeries.map((item) => ({ mes: item.ano, recebido: item.valor, previsto: 0 }))} margin={{ left: 8, right: 8, top: 22 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey={period === "month" ? "mes" : "mes"} tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value}`} width={64} />
              <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatBRL(Number(value))} />} />
              <Bar dataKey="recebido" name="Recebido" fill="var(--color-recebido)" radius={[4, 4, 0, 0]} maxBarSize={44}><LabelList dataKey="recebido" position="top" formatter={(value) => Number(value ?? 0) > 0 ? formatBRL(Number(value)) : ""} className="fill-muted-foreground text-[10px]" /></Bar>
              <Bar dataKey="previsto" name="A receber / estimativa" fill="var(--color-previsto)" radius={[4, 4, 0, 0]} maxBarSize={44}><LabelList dataKey="previsto" position="top" formatter={(value) => Number(value ?? 0) > 0 ? formatBRL(Number(value)) : ""} className="fill-muted-foreground text-[10px]" /></Bar>
            </BarChart>
          </ChartContainer>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <div className="flex min-w-56 flex-1 items-center justify-between rounded-md border px-3 py-2"><span className="text-muted-foreground">Total recebido</span><strong data-sensitive="true">{formatBRL(period === "year" ? monthlyTotals.received : receivedTotal)}</strong></div>
            <div className="flex min-w-56 flex-1 items-center justify-between rounded-md border px-3 py-2"><span className="text-muted-foreground">Total a receber / estimado</span><strong data-sensitive="true">{formatBRL(period === "year" ? monthlyTotals.forecast : futureTotal)}</strong></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Crescimento anual de proventos</CardTitle><p className="text-sm text-muted-foreground">O ano atual pode incluir estimativas para os meses restantes.</p></CardHeader>
          <CardContent>{annualSeries.length === 0 ? <p className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">Ainda não há histórico anual disponível. Cadastre os pagamentos recebidos ou sincronize os eventos disponíveis da fonte.</p> : <ChartContainer data-privacy-chart="true" className="h-[260px] w-full" config={yearConfig}><BarChart accessibilityLayer data={annualSeries} margin={{ left: 8, right: 8, top: 20 }}><CartesianGrid vertical={false} /><XAxis dataKey="ano" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value}`} width={60} /><ChartTooltip content={<ChartTooltipContent formatter={(value) => formatBRL(Number(value))} />} /><Bar dataKey="valor" name="Total anual" radius={[5, 5, 0, 0]} maxBarSize={64}>{annualSeries.map((item) => <Cell key={item.ano} fill={item.projetado ? "var(--color-chart-4)" : "var(--color-chart-2)"} />)}<LabelList dataKey="crescimento" position="top" formatter={(value) => value == null ? "" : `${Number(value) >= 0 ? "+" : ""}${Number(value).toFixed(1)}%`} className="privacy-public-percent fill-muted-foreground text-[10px]" /></Bar></BarChart></ChartContainer>}
            {selectedAnnual && <p data-sensitive="true" className="mt-3 text-sm text-muted-foreground">{year}: {formatBRL(monthlyYear.reduce((total, point) => total + point.recebido, 0))} recebidos{monthlyTotals.forecast > 0 ? ` · ${formatBRL(monthlyTotals.forecast)} previstos/estimados` : ""}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{period === "month" ? `Eventos — ${monthNames[selectedMonth - 1]} ${year}` : `Eventos — ${year}`}</CardTitle></CardHeader>
          <CardContent>
            {receivedForSelection.length + futureForSelection.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum evento disponível para este período.</p> : <div className="divide-y">
              {[...receivedForSelection.map((event) => ({ ...event, status: "Recebido" })), ...futureForSelection.map((event) => ({ ...event, status: event.estimated ? "Estimativa" : "Confirmado" }))].sort((a, b) => a.date.getTime() - b.date.getTime()).map((event) => <div key={event.id} className="flex items-center justify-between gap-3 py-3 text-sm"><div><p className="font-medium">{event.ticker} <span className="text-xs text-muted-foreground">· {event.status}</span></p><p className="text-muted-foreground">{event.estimated ? "Data estimada" : "Pagamento"}: {event.date.toLocaleDateString("pt-BR")}</p></div><strong data-sensitive="true">{formatBRL(event.amount)}</strong></div>)}
            </div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
