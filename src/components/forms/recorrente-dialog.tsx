"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColorPicker } from "@/components/color-picker";
import { createRecurring, updateRecurring } from "@/lib/actions";
import { FREQUENCIAS, DIAS_SEMANA, MESES, CHART_COLORS } from "@/lib/constants";

type Opt = { id: string; name: string; kind?: string };

export type RecorrenteEdit = {
  id: string;
  description: string;
  amount: number;
  kind: string;
  frequency: string;
  dayOfMonth: number;
  dayOfWeek: number | null;
  month: number | null;
  color: string;
  categoryId: string | null;
  accountId: string | null;
  creditCardId: string | null;
};

export function RecorrenteDialog({
  categorias,
  contas,
  cartoes,
  recorrente,
}: {
  categorias: Opt[];
  contas: Opt[];
  cartoes: Opt[];
  recorrente?: RecorrenteEdit;
}) {
  const isEdit = !!recorrente;
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const [kind, setKind] = useState<"despesa" | "receita">(
    (recorrente?.kind as "despesa" | "receita") ?? "despesa"
  );
  const [frequency, setFrequency] = useState(recorrente?.frequency ?? "mensal");
  const [dayOfWeek, setDayOfWeek] = useState(
    String(recorrente?.dayOfWeek ?? 1)
  );
  const [mes, setMes] = useState(
    String(recorrente?.month ?? new Date().getMonth() + 1)
  );
  const [paymentType, setPaymentType] = useState<"account" | "card">(
    recorrente?.creditCardId ? "card" : "account"
  );
  const [categoryId, setCategoryId] = useState(recorrente?.categoryId ?? "");
  const [accountId, setAccountId] = useState(recorrente?.accountId ?? "");
  const [creditCardId, setCreditCardId] = useState(recorrente?.creditCardId ?? "");
  const [cor, setCor] = useState(recorrente?.color ?? CHART_COLORS[0]);

  const categoriasFiltradas = categorias.filter((c) => c.kind === kind);
  const usarCartao = kind === "despesa" && paymentType === "card";
  const usaDiaDoMes = frequency === "mensal" || frequency === "quinzenal";
  const usaMesAncora =
    frequency === "anual" ||
    frequency === "trimestral" ||
    frequency === "semestral";

  function trocarKind(v: string) {
    setKind(v as "despesa" | "receita");
    setCategoryId("");
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("kind", kind);
    fd.set("frequency", frequency);
    fd.set("dayOfWeek", dayOfWeek);
    fd.set("month", mes);
    fd.set("paymentType", kind === "receita" ? "account" : paymentType);
    fd.set("categoryId", categoryId);
    fd.set("accountId", accountId);
    fd.set("creditCardId", creditCardId);
    fd.set("color", cor);
    start(async () => {
      const res = isEdit
        ? await updateRecurring(recorrente!.id, fd)
        : await createRecurring(fd);
      if (res.ok) {
        toast.success(isEdit ? "Recorrente atualizada." : "Recorrente criada.");
        setOpen(false);
        if (!isEdit) {
          form.reset();
          setKind("despesa");
          setFrequency("mensal");
          setPaymentType("account");
          setCategoryId("");
          setAccountId("");
          setCreditCardId("");
          setCor(CHART_COLORS[0]);
        }
      } else toast.error(res.error ?? "Erro ao salvar.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            aria-label="Editar recorrente"
          >
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="size-4" />
            Nova recorrente
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Editar recorrente" : "Nova transação recorrente"}
            </DialogTitle>
            <DialogDescription>
              Lançamentos fixos que se repetem (assinaturas, salário…).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Tabs value={kind} onValueChange={trocarKind}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="despesa">Despesa</TabsTrigger>
                <TabsTrigger value="receita">Receita</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid gap-2">
              <Label htmlFor="rec-desc">Descrição</Label>
              <Input
                id="rec-desc"
                name="description"
                placeholder="Ex.: Netflix, Salário, IPVA"
                defaultValue={recorrente?.description ?? ""}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="rec-amount">Valor (R$)</Label>
              <Input
                id="rec-amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                defaultValue={recorrente?.amount ?? ""}
                required
              />
            </div>

            {/* Frequência + agendamento */}
            <div className="grid gap-2">
              <Label>Frequência</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIAS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {usaDiaDoMes && (
              <div className="grid gap-2">
                <Label htmlFor="rec-day">
                  {frequency === "quinzenal" ? "Primeiro dia do mês" : "Dia do mês"}
                </Label>
                <Input
                  id="rec-day"
                  name="dayOfMonth"
                  type="number"
                  min="1"
                  max="31"
                  defaultValue={recorrente?.dayOfMonth ?? 1}
                  required
                />
                {frequency === "quinzenal" && (
                  <p className="text-xs text-muted-foreground">
                    Repete também 15 dias depois (ex.: dia 5 e dia 20).
                  </p>
                )}
              </div>
            )}

            {frequency === "semanal" && (
              <div className="grid gap-2">
                <Label>Dia da semana</Label>
                <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAS_SEMANA.map((d, i) => (
                      <SelectItem key={d} value={String(i)}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {usaMesAncora && (
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>
                    {frequency === "anual" ? "Mês" : "Mês inicial"}
                  </Label>
                  <Select value={mes} onValueChange={setMes}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MESES.map((m, i) => (
                        <SelectItem key={m} value={String(i + 1)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rec-day-anual">Dia</Label>
                  <Input
                    id="rec-day-anual"
                    name="dayOfMonth"
                    type="number"
                    min="1"
                    max="31"
                    defaultValue={recorrente?.dayOfMonth ?? 1}
                    required
                  />
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categoriasFiltradas.length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Nenhuma categoria de {kind}.
                    </div>
                  )}
                  {categoriasFiltradas.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {kind === "despesa" && (
              <div className="grid gap-2">
                <Label>Forma de pagamento</Label>
                <Tabs
                  value={paymentType}
                  onValueChange={(v) => setPaymentType(v as "account" | "card")}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="account">Conta / Carteira</TabsTrigger>
                    <TabsTrigger value="card">Cartão de crédito</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}

            {usarCartao ? (
              <div className="grid gap-2">
                <Label>Cartão</Label>
                <Select value={creditCardId} onValueChange={setCreditCardId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cartão" />
                  </SelectTrigger>
                  <SelectContent>
                    {cartoes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label>Conta / Carteira</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {contas.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Cor</Label>
              <ColorPicker value={cor} onChange={setCor} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending} className="w-full">
              {pending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Salvar alterações" : "Criar recorrente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
