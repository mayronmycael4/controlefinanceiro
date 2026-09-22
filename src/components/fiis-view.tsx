"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Landmark, LayoutGrid, List, Table2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/format";

type Fii = {
  id: string; ticker: string; name: string; color: string; currentPrice: number; priceUpdatedAt: Date | null;
  quantidade: number; precoMedio: number; valorAtual: number; lucro: number; lucroTotal: number;
  rentabilidadePct: number; rentabilidadeTotalPct: number; dividendYield12m: number; yieldOnCost: number;
  rendaMensalAtual: number; participacaoCarteira: number; fonteCotacao: string | null;
};
type Mode = "normal" | "minimal" | "list" | "table";

const modes: Array<{ id: Mode; label: string; icon: typeof LayoutGrid }> = [
  { id: "normal", label: "Normal", icon: LayoutGrid }, { id: "minimal", label: "Minimalista", icon: Landmark },
  { id: "list", label: "Lista", icon: List }, { id: "table", label: "Tabela", icon: Table2 },
];

export function FiisView({ fiis }: { fiis: Fii[] }) {
  const [mode, setMode] = useState<Mode>("normal");
  useEffect(() => { const saved = window.localStorage.getItem("fiis-view-mode") as Mode | null; if (saved && modes.some((item) => item.id === saved)) setMode(saved); }, []);
  function changeMode(next: Mode) { setMode(next); window.localStorage.setItem("fiis-view-mode", next); }

  return <>
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card p-2">
      <span className="px-2 text-sm text-muted-foreground">Visualização</span>
      <div className="flex flex-wrap gap-1">{modes.map(({ id, label, icon: Icon }) => <Button key={id} size="sm" variant={mode === id ? "default" : "ghost"} onClick={() => changeMode(id)} title={`Visualização ${label}`}><Icon />{label}</Button>)}</div>
    </div>
    <div data-privacy-cards="true">{mode === "table" ? <TableView fiis={fiis} /> : mode === "list" ? <ListView fiis={fiis} /> : <div className={mode === "minimal" ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-4" : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"}>{fiis.map((f) => mode === "minimal" ? <MinimalCard key={f.id} f={f} /> : <NormalCard key={f.id} f={f} />)}</div>}</div>
  </>;
}

function MinimalCard({ f }: { f: Fii }) { return <Link href={`/fiis/${f.id}`}><Card className="transition hover:border-foreground/30"><CardContent className="grid gap-2 p-4"><div className="flex items-center justify-between"><span className="font-bold">{f.ticker}</span><span className={f.lucroTotal >= 0 ? "text-emerald-600" : "text-red-600"}>{f.rentabilidadeTotalPct.toFixed(2)}%</span></div><div className="flex justify-between text-sm"><span className="text-muted-foreground">Cotas</span><span>{f.quantidade}</span></div><div className="flex justify-between text-sm"><span className="text-muted-foreground">Cotação</span><span>{formatBRL(f.currentPrice)}</span></div><div className="flex justify-between border-t pt-2 text-sm"><span className="text-muted-foreground">Valor atual</span><strong>{formatBRL(f.valorAtual)}</strong></div></CardContent></Card></Link>; }

function NormalCard({ f }: { f: Fii }) { return <Link href={`/fiis/${f.id}`}><Card className="h-full transition hover:border-foreground/30"><CardHeader className="flex flex-row items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-md text-white" style={{ backgroundColor: f.color }}><Landmark className="size-4" /></span><div><CardTitle className="text-base">{f.ticker}</CardTitle>{f.name && <CardDescription className="truncate">{f.name}</CardDescription>}</div></div></CardHeader><CardContent className="grid gap-1 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Cotas</span><span>{f.quantidade}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Preço médio</span><span>{formatBRL(f.precoMedio)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Cotação atual</span><span>{formatBRL(f.currentPrice)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">DY 12M / YoC</span><span>{f.dividendYield12m.toFixed(2)}% / {f.yieldOnCost.toFixed(2)}%</span></div><div className="flex justify-between"><span className="text-muted-foreground">Renda mensal</span><span>{formatBRL(f.rendaMensalAtual)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Participação</span><span>{f.participacaoCarteira.toFixed(2)}%</span></div><div className="mt-2 flex justify-between border-t pt-2"><span className="text-muted-foreground">Valor atual</span><strong>{formatBRL(f.valorAtual)}</strong></div><div className="flex justify-between"><span className="text-muted-foreground">Resultado total</span><strong className={f.lucroTotal >= 0 ? "text-emerald-600" : "text-red-600"}>{formatBRL(f.lucroTotal)} ({f.rentabilidadeTotalPct.toFixed(2)}%)</strong></div></CardContent></Card></Link>; }

function ListView({ fiis }: { fiis: Fii[] }) { return <div className="grid gap-2">{fiis.map((f) => <Link key={f.id} href={`/fiis/${f.id}`}><Card className="transition hover:border-foreground/30"><CardContent className="flex flex-wrap items-center gap-4 p-4"><div className="min-w-28"><p className="font-bold">{f.ticker}</p><p className="truncate text-xs text-muted-foreground">{f.name}</p></div><div><p className="text-xs text-muted-foreground">Cotas</p><p>{f.quantidade}</p></div><div><p className="text-xs text-muted-foreground">Cotação</p><p>{formatBRL(f.currentPrice)}</p></div><div><p className="text-xs text-muted-foreground">Valor</p><p>{formatBRL(f.valorAtual)}</p></div><div className="ml-auto"><Badge variant={f.lucroTotal >= 0 ? "secondary" : "destructive"}>{formatBRL(f.lucroTotal)} · {f.rentabilidadeTotalPct.toFixed(2)}%</Badge></div></CardContent></Card></Link>)}</div>; }

function TableView({ fiis }: { fiis: Fii[] }) { return <Card><CardContent className="overflow-x-auto p-0"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-3">Ativo</th><th className="p-3 text-right">Cotas</th><th className="p-3 text-right">Preço médio</th><th className="p-3 text-right">Cotação</th><th className="p-3 text-right">Valor atual</th><th className="p-3 text-right">Resultado</th><th className="p-3 text-right">Rentabilidade</th></tr></thead><tbody>{fiis.map((f) => <tr key={f.id} className="border-b last:border-0 hover:bg-muted/50"><td className="p-3"><Link className="font-semibold hover:underline" href={`/fiis/${f.id}`}>{f.ticker}</Link><div className="text-xs text-muted-foreground">{f.name}</div></td><td className="p-3 text-right">{f.quantidade}</td><td className="p-3 text-right">{formatBRL(f.precoMedio)}</td><td className="p-3 text-right">{formatBRL(f.currentPrice)}</td><td className="p-3 text-right font-medium">{formatBRL(f.valorAtual)}</td><td className={`p-3 text-right font-medium ${f.lucroTotal >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatBRL(f.lucroTotal)}</td><td className="p-3 text-right">{f.rentabilidadeTotalPct.toFixed(2)}%</td></tr>)}</tbody></table></CardContent></Card>; }
