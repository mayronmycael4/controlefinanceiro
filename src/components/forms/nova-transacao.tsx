"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2, Check, X } from "lucide-react";
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
import { DatePicker } from "@/components/ui/date-picker";
import { createTransaction, updateTransaction, createCategory } from "@/lib/actions";
import { formatBRL } from "@/lib/format";
import { FREQUENCIAS_REPETICAO, freqRepeticaoLabel } from "@/lib/constants";

type Opt = { id: string; name: string; kind?: string };

export type TransacaoEdit = {
  id: string;
  description: string;
  amount: number;
  kind: string;
  status: string;
  date: string | Date;
  purchaseDate?: string | Date | null;
  categoryId: string | null;
  accountId: string | null;
  creditCardId: string | null;
  tags?: string;
};

function toDateInput(d: string | Date | undefined): string {
  if (!d) return new Date().toISOString().slice(0, 10);
  const date = typeof d === "string" ? new Date(d) : d;
  // Usa a data local para não deslocar o dia por fuso
  const off = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - off).toISOString().slice(0, 10);
}

export function TransacaoDialog({
  categorias,
  contas,
  cartoes,
  transacao,
  presetCardId,
  presetAccountId,
  open: openProp,
  onOpenChange,
  showTrigger = true,
}: {
  categorias: Opt[];
  contas: Opt[];
  cartoes: Opt[];
  transacao?: TransacaoEdit;
  presetCardId?: string;
  presetAccountId?: string;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  showTrigger?: boolean;
}) {
  const isEdit = !!transacao;
  const controlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlled ? openProp : internalOpen;
  const setOpen = (o: boolean) =>
    controlled ? onOpenChange?.(o) : setInternalOpen(o);

  const [pending, start] = useTransition();

  const [kind, setKind] = useState<"despesa" | "receita">(
    (transacao?.kind as "despesa" | "receita") ?? "despesa"
  );
  const [status, setStatus] = useState<"pago" | "pendente">(
    (transacao?.status as "pago" | "pendente") ?? (presetCardId ? "pendente" : "pago")
  );
  const [paymentType, setPaymentType] = useState<"account" | "card">(
    transacao?.creditCardId || presetCardId ? "card" : "account"
  );
  const [categoryId, setCategoryId] = useState(transacao?.categoryId ?? "");
  const [accountId, setAccountId] = useState(
    transacao?.accountId ?? presetAccountId ?? ""
  );
  const [creditCardId, setCreditCardId] = useState(
    transacao?.creditCardId ?? presetCardId ?? ""
  );

  // Valor + parcelamento (só cartão, ao criar)
  const [valor, setValor] = useState(transacao ? String(transacao.amount) : "");
  const [parcelas, setParcelas] = useState("1");
  const [modoParcela, setModoParcela] = useState<"total" | "parcela">("total");
  // Repetir N vezes (conta/receita, ao criar) — não é pra sempre como recorrente
  const [repeticoes, setRepeticoes] = useState("1");
  const [repeticaoFreq, setRepeticaoFreq] = useState("mensal");

  const [novasCategorias, setNovasCategorias] = useState<Opt[]>([]);
  const [addingCat, setAddingCat] = useState(false);
  const [novaCatNome, setNovaCatNome] = useState("");
  const [catPending, startCat] = useTransition();

  const todasCategorias = [...categorias, ...novasCategorias].filter(
    (c, i, arr) => arr.findIndex((x) => x.id === c.id) === i
  );
  const categoriasFiltradas = todasCategorias.filter((c) => c.kind === kind);

  function trocarKind(v: string) {
    setKind(v as "despesa" | "receita");
    setCategoryId("");
    setAddingCat(false);
    setNovaCatNome("");
  }

  function criarCategoria() {
    const nome = novaCatNome.trim();
    if (!nome) return;
    const fd = new FormData();
    fd.set("name", nome);
    fd.set("kind", kind);
    startCat(async () => {
      const res = await createCategory(fd);
      if (res.ok && res.category) {
        setNovasCategorias((p) => [
          ...p,
          { id: res.category!.id, name: res.category!.name, kind: res.category!.kind },
        ]);
        setCategoryId(res.category.id);
        setNovaCatNome("");
        setAddingCat(false);
        toast.success("Categoria criada.");
      } else {
        toast.error(res.error ?? "Erro ao criar categoria.");
      }
    });
  }

  function resetCreate() {
    setKind("despesa");
    setStatus(presetCardId ? "pendente" : "pago");
    setPaymentType(presetCardId ? "card" : "account");
    setCategoryId("");
    setAccountId(presetAccountId ?? "");
    setCreditCardId(presetCardId ?? "");
    setValor("");
    setParcelas("1");
    setModoParcela("total");
    setRepeticoes("1");
    setRepeticaoFreq("mensal");
    setAddingCat(false);
    setNovaCatNome("");
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("kind", kind);
    fd.set("status", status);
    fd.set("paymentType", kind === "receita" ? "account" : paymentType);
    fd.set("categoryId", categoryId);
    fd.set("accountId", accountId);
    fd.set("creditCardId", creditCardId);
    fd.set("amount", valor);
    fd.set("parcelas", parcelaAtiva ? parcelas : "1");
    fd.set("installmentMode", modoParcela);
    fd.set("repeticoes", repetirDisponivel ? repeticoes : "1");
    fd.set("repeticaoFreq", repeticaoFreq);

    start(async () => {
      const res = isEdit
        ? await updateTransaction(transacao!.id, fd)
        : await createTransaction(fd);
      if (res.ok) {
        toast.success(isEdit ? "Transação atualizada." : "Transação adicionada.");
        setOpen(false);
        if (!isEdit) {
          form.reset();
          resetCreate();
        }
      } else {
        toast.error(res.error ?? "Erro ao salvar.");
      }
    });
  }

  const usarCartao = kind === "despesa" && paymentType === "card";
  const parcelasNum = Math.max(parseInt(parcelas, 10) || 1, 1);
  const parcelaAtiva = usarCartao && !isEdit && parcelasNum > 1;
  // Repetir N vezes: disponível p/ conta/receita (cartão usa parcelas), ao criar
  const repetirDisponivel = !isEdit && !usarCartao;
  const repeticoesNum = Math.max(parseInt(repeticoes, 10) || 1, 1);
  const valorNum = parseFloat(valor) || 0;
  const valorParcela =
    modoParcela === "total" ? valorNum / parcelasNum : valorNum;
  const valorTotal =
    modoParcela === "total" ? valorNum : valorNum * parcelasNum;
  const amountLabel = parcelaAtiva
    ? modoParcela === "total"
      ? "Valor total (R$)"
      : "Valor da parcela (R$)"
    : "Valor (R$)";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="size-4" />
            Nova transação
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar transação" : "Nova transação"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Altere os dados e salve."
                : "Registre uma receita ou despesa."}
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
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                name="description"
                placeholder="Ex.: Supermercado"
                defaultValue={transacao?.description ?? ""}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="amount">{amountLabel}</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">
                  {usarCartao ? "Data da compra" : "Data"}
                </Label>
                <DatePicker
                  id="date"
                  name="date"
                  defaultValue={toDateInput(transacao?.purchaseDate ?? transacao?.date)}
                  required
                />
              </div>
            </div>
            {usarCartao && (
              <p className="-mt-2 text-xs text-muted-foreground">
                A fatura é definida pelo dia de fechamento do cartão.
              </p>
            )}

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Categoria</Label>
                {!addingCat && (
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => setAddingCat(true)}
                  >
                    <Plus className="size-3" />
                    Nova categoria
                  </button>
                )}
              </div>

              {addingCat ? (
                <div className="flex gap-2">
                  <Input
                    autoFocus
                    placeholder={`Nova categoria de ${kind}`}
                    value={novaCatNome}
                    onChange={(e) => setNovaCatNome(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        criarCategoria();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    onClick={criarCategoria}
                    disabled={catPending || !novaCatNome.trim()}
                    aria-label="Criar categoria"
                  >
                    {catPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      setAddingCat(false);
                      setNovaCatNome("");
                    }}
                    aria-label="Cancelar"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasFiltradas.length === 0 && (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        Nenhuma categoria de {kind}. Clique em “Nova categoria”.
                      </div>
                    )}
                    {categoriasFiltradas.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tags">Etiquetas (opcional)</Label>
              <Input
                id="tags"
                name="tags"
                placeholder="viagem, trabalho"
                defaultValue={transacao?.tags ?? ""}
              />
              <p className="text-xs text-muted-foreground">
                Separe por vírgula. Ex.: viagem, presente.
              </p>
            </div>

            {kind === "despesa" && (
              <div className="grid gap-2">
                <Label>Forma de pagamento</Label>
                <Tabs
                  value={paymentType}
                  onValueChange={(v) => {
                    const pt = v as "account" | "card";
                    setPaymentType(pt);
                    // Compra no cartão entra como pendente (vai pra fatura)
                    if (!isEdit) setStatus(pt === "card" ? "pendente" : "pago");
                  }}
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

            {usarCartao && !isEdit && (
              <div className="grid gap-2 rounded-lg border p-3">
                <div className="grid grid-cols-2 items-end gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="parcelas">Parcelas</Label>
                    <Input
                      id="parcelas"
                      type="number"
                      min="1"
                      max="48"
                      value={parcelas}
                      onChange={(e) => setParcelas(e.target.value)}
                    />
                  </div>
                  {parcelasNum > 1 && (
                    <Tabs
                      value={modoParcela}
                      onValueChange={(v) => setModoParcela(v as "total" | "parcela")}
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="total">Valor total</TabsTrigger>
                        <TabsTrigger value="parcela">Da parcela</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  )}
                </div>
                {parcelasNum > 1 && valorNum > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {parcelasNum}x de{" "}
                    <span className="font-medium text-foreground">
                      {formatBRL(valorParcela)}
                    </span>{" "}
                    = {formatBRL(valorTotal)}
                  </p>
                )}
              </div>
            )}

            {repetirDisponivel && (
              <div className="grid gap-2 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <Label>Repetir</Label>
                  <p className="text-xs text-muted-foreground">
                    Por tempo limitado (não é pra sempre).
                  </p>
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <Select value={repeticaoFreq} onValueChange={setRepeticaoFreq}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIAS_REPETICAO.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Input
                      id="repeticoes"
                      type="number"
                      min="1"
                      max="60"
                      className="w-20"
                      value={repeticoes}
                      onChange={(e) => setRepeticoes(e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">vezes</span>
                  </div>
                </div>
                {repeticoesNum > 1 && valorNum > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {repeticoesNum} lançamentos ({freqRepeticaoLabel(repeticaoFreq).toLowerCase()}) de{" "}
                    <span className="font-medium text-foreground">
                      {formatBRL(valorNum)}
                    </span>{" "}
                    = {formatBRL(valorNum * repeticoesNum)}
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label>Status</Label>
              <Tabs value={status} onValueChange={(v) => setStatus(v as "pago" | "pendente")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="pago">Pago</TabsTrigger>
                  <TabsTrigger value="pendente">Pendente</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending} className="w-full">
              {pending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Salvar alterações" : "Salvar transação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Wrapper de criação (mantém a API usada nas páginas)
export function NovaTransacao(props: {
  categorias: Opt[];
  contas: Opt[];
  cartoes: Opt[];
}) {
  return <TransacaoDialog {...props} />;
}
