"use client";

import { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Wallet,
  PiggyBank,
  Percent,
  CreditCard,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SaudeFinanceira } from "@/lib/queries";

type Opt = { id: string; name: string };
type Nivel = "bom" | "atencao" | "ruim";

// pior nível vence
function pior(a: Nivel, b: Nivel): Nivel {
  const ord = { bom: 0, atencao: 1, ruim: 2 };
  return ord[a] >= ord[b] ? a : b;
}

export function SimuladorCompra({
  snapshot,
  categorias,
}: {
  snapshot: SaudeFinanceira;
  categorias: Opt[];
}) {
  const [valorStr, setValorStr] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [parcelasStr, setParcelasStr] = useState("1");

  const valor = parseFloat(valorStr) || 0;
  const parcelas = Math.min(Math.max(parseInt(parcelasStr) || 1, 1), 24);
  const parcela = valor / parcelas;

  const { saldoLivre, rendaMes, disponivel, aVencer } = snapshot;
  const reserva = Math.max(rendaMes * 0.1, 0); // folga mínima recomendada
  const catBudget = snapshot.categorias.find((c) => c.categoryId === categoryId);

  // --- Sinais ---
  // 1) Folga após a compra (impacto deste mês = 1ª parcela)
  const folgaApos = saldoLivre - parcela;
  const folgaAvista = saldoLivre - valor;
  let nivelFolga: Nivel = "bom";
  if (folgaApos < 0) nivelFolga = "ruim";
  else if (folgaApos < reserva) nivelFolga = "atencao";

  // 2) Orçamento da categoria (se escolhida e com orçamento)
  const temOrc = !!catBudget;
  const estouraOrc = catBudget ? valor > catBudget.restante : false;
  const nivelOrc: Nivel = !temOrc ? "bom" : estouraOrc ? "atencao" : "bom";

  // 3) Peso na renda do mês
  const pctRenda = rendaMes > 0 ? (valor / rendaMes) * 100 : 0;
  let nivelRenda: Nivel = "bom";
  if (rendaMes > 0) {
    if (pctRenda > 50) nivelRenda = "ruim";
    else if (pctRenda > 20) nivelRenda = "atencao";
  }

  const nivelGeral: Nivel = [nivelFolga, nivelOrc, nivelRenda].reduce(pior, "bom");

  const temValor = valor > 0;

  const veredito = {
    bom: {
      Icon: ShieldCheck,
      titulo: "Compra saudável",
      texto: "Cabe no seu mês e mantém uma boa folga.",
      classe:
        "border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
      dot: "bg-emerald-500",
    },
    atencao: {
      Icon: AlertTriangle,
      titulo: "Compra com atenção",
      texto: "Dá pra fazer, mas aperta em algum ponto — veja abaixo.",
      classe:
        "border-amber-500/40 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
      dot: "bg-amber-500",
    },
    ruim: {
      Icon: ShieldAlert,
      titulo: "Compra arriscada",
      texto: "Compromete o essencial do mês. Melhor repensar ou adiar.",
      classe:
        "border-destructive/40 bg-destructive/10 text-destructive",
      dot: "bg-destructive",
    },
  }[nivelGeral];

  // Dicas
  const dicas: string[] = [];
  if (temValor) {
    if (folgaAvista < 0 && folgaApos >= 0 && parcelas === 1) {
      dicas.push(
        `À vista você ficaria negativo em ${formatBRL(-folgaAvista)}. Parcelar deixaria a compra mais leve por mês.`
      );
    }
    if (estouraOrc && catBudget) {
      dicas.push(
        `Ultrapassa o orçamento de ${catBudget.nome} em ${formatBRL(
          valor - catBudget.restante
        )} (restam ${formatBRL(catBudget.restante)}).`
      );
    }
    if (nivelFolga === "atencao") {
      dicas.push(
        `Ficaria com ${formatBRL(folgaApos)} de folga — recomendado manter ao menos ${formatBRL(
          reserva
        )} de reserva.`
      );
    }
    if (nivelGeral === "bom") {
      dicas.push(`Sobra ${formatBRL(folgaApos)} de folga depois da compra. 👍`);
    }
    if (parcelas > 1) {
      dicas.push(
        `${parcelas}× de ${formatBRL(parcela)} — compromisso total de ${formatBRL(valor)}.`
      );
    }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Simular uma compra</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="sim-valor">Valor da compra (R$)</Label>
            <Input
              id="sim-valor"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              placeholder="0,00"
              value={valorStr}
              onChange={(e) => setValorStr(e.target.value)}
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label>Categoria (opcional)</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Sem categoria" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sim-parcelas">Parcelas</Label>
            <Input
              id="sim-parcelas"
              type="number"
              min="1"
              max="24"
              value={parcelasStr}
              onChange={(e) => setParcelasStr(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {!temValor ? (
        <Card>
          <CardContent className="flex h-28 items-center justify-center text-center text-sm text-muted-foreground">
            Digite um valor acima para ver se a compra é saudável.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Veredito */}
          <div className={cn("flex items-start gap-3 rounded-xl border p-4", veredito.classe)}>
            <veredito.Icon className="mt-0.5 size-6 shrink-0" />
            <div>
              <div className="text-lg font-semibold">{veredito.titulo}</div>
              <div className="text-sm opacity-90">{veredito.texto}</div>
            </div>
          </div>

          {/* Sinais */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Sinal
              nivel={nivelFolga}
              icon={Wallet}
              titulo="Folga após a compra"
              valor={formatBRL(folgaApos)}
              legenda={
                parcelas > 1
                  ? `depois da 1ª parcela (${formatBRL(parcela)})`
                  : `de ${formatBRL(saldoLivre)} livres hoje`
              }
            />
            <Sinal
              nivel={nivelOrc}
              icon={PiggyBank}
              titulo={catBudget ? `Orçamento de ${catBudget.nome}` : "Orçamento"}
              valor={
                catBudget
                  ? formatBRL(Math.max(catBudget.restante - valor, 0))
                  : "—"
              }
              legenda={
                catBudget
                  ? `restam ${formatBRL(catBudget.restante)} este mês`
                  : "sem orçamento nesta categoria"
              }
            />
            <Sinal
              nivel={nivelRenda}
              icon={Percent}
              titulo="Peso na renda"
              valor={rendaMes > 0 ? `${pctRenda.toFixed(0)}%` : "—"}
              legenda={
                rendaMes > 0
                  ? `da renda do mês (${formatBRL(rendaMes)})`
                  : "renda do mês não registrada"
              }
            />
          </div>

          {/* Dicas */}
          {dicas.length > 0 && (
            <Card>
              <CardContent className="grid gap-2 py-4 text-sm">
                {dicas.map((d, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", veredito.dot)} />
                    <span>{d}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Contexto */}
          <Card>
            <CardContent className="grid gap-3 py-4 sm:grid-cols-3">
              <Contexto icon={Wallet} rotulo="Disponível nas contas" valor={formatBRL(disponivel)} />
              <Contexto icon={CreditCard} rotulo="Contas a vencer no mês" valor={formatBRL(aVencer)} />
              <Contexto icon={PiggyBank} rotulo="Saldo livre" valor={formatBRL(saldoLivre)} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Sinal({
  nivel,
  icon: Icon,
  titulo,
  valor,
  legenda,
}: {
  nivel: Nivel;
  icon: typeof Wallet;
  titulo: string;
  valor: string;
  legenda: string;
}) {
  const cor =
    nivel === "bom"
      ? "text-emerald-600 dark:text-emerald-500"
      : nivel === "atencao"
        ? "text-amber-600 dark:text-amber-500"
        : "text-destructive";
  return (
    <Card>
      <CardContent className="grid gap-1 py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon className={cn("size-4", cor)} />
          {titulo}
        </div>
        <div className={cn("text-xl font-bold", cor)}>{valor}</div>
        <div className="text-xs text-muted-foreground">{legenda}</div>
      </CardContent>
    </Card>
  );
}

function Contexto({
  icon: Icon,
  rotulo,
  valor,
}: {
  icon: typeof Wallet;
  rotulo: string;
  valor: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{rotulo}</div>
        <div className="font-semibold">{valor}</div>
      </div>
    </div>
  );
}
