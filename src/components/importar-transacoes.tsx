"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, FileUp } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { importTransactions } from "@/lib/actions";
import { formatBRL } from "@/lib/format";

type Opt = { id: string; name: string };
type ImportRow = {
  date: string;
  description: string;
  amount: number;
  kind: "receita" | "despesa";
};

function toISO(raw: string): string | null {
  const s = raw.trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); // ISO ou OFX (YYYYMMDD já tratado antes)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{2})[/\-.](\d{2})[/\-.](\d{2,4})/); // DD/MM/YYYY
  if (m) {
    const y = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${y}-${m[2]}-${m[1]}`;
  }
  m = s.match(/^(\d{8})/); // YYYYMMDD (OFX)
  if (m) return `${m[1].slice(0, 4)}-${m[1].slice(4, 6)}-${m[1].slice(6, 8)}`;
  return null;
}

function parseValor(raw: string): number {
  let s = raw.trim().replace(/[R$\s]/g, "");
  // pt-BR "1.234,56" -> "1234.56"; en "1234.56" fica igual
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else if (s.includes(",")) s = s.replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}

function splitCsvLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (c === delim && !inQuotes) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out.map((v) => v.trim());
}

function parseOFX(text: string): ImportRow[] {
  const rows: ImportRow[] = [];
  const blocks = text.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) ?? [];
  for (const b of blocks) {
    const dt = b.match(/<DTPOSTED>([^<\r\n]+)/i)?.[1] ?? "";
    const amt = b.match(/<TRNAMT>([^<\r\n]+)/i)?.[1] ?? "";
    const memo =
      b.match(/<MEMO>([^<\r\n]+)/i)?.[1] ??
      b.match(/<NAME>([^<\r\n]+)/i)?.[1] ??
      "Lançamento";
    const date = toISO(dt);
    const valor = parseValor(amt);
    if (!date || !Number.isFinite(valor)) continue;
    rows.push({
      date,
      description: memo.trim(),
      amount: Math.abs(valor),
      kind: valor >= 0 ? "receita" : "despesa",
    });
  }
  return rows;
}

function parseCSV(text: string): ImportRow[] {
  const linhas = text.split(/\r?\n/).filter((l) => l.trim());
  if (linhas.length === 0) return [];
  const delim = (linhas[0].match(/;/g)?.length ?? 0) >= (linhas[0].match(/,/g)?.length ?? 0) ? ";" : ",";

  const primeiro = splitCsvLine(linhas[0], delim).map((c) => c.toLowerCase());
  const temHeader = primeiro.some((c) =>
    /data|date|valor|amount|desc|histó|memo|montante/.test(c)
  );
  const idx = (keys: string[]) => primeiro.findIndex((c) => keys.some((k) => c.includes(k)));
  let iData = temHeader ? idx(["data", "date"]) : 0;
  let iDesc = temHeader ? idx(["desc", "histó", "memo", "lança", "title", "name"]) : 1;
  let iVal = temHeader ? idx(["valor", "amount", "montante", "value"]) : 2;
  if (iData < 0) iData = 0;
  if (iDesc < 0) iDesc = 1;
  if (iVal < 0) iVal = 2;

  const corpo = temHeader ? linhas.slice(1) : linhas;
  const rows: ImportRow[] = [];
  for (const l of corpo) {
    const cols = splitCsvLine(l, delim);
    const date = toISO(cols[iData] ?? "");
    const valor = parseValor(cols[iVal] ?? "");
    const desc = (cols[iDesc] ?? "").trim() || "Lançamento";
    if (!date || !Number.isFinite(valor) || valor === 0) continue;
    rows.push({
      date,
      description: desc,
      amount: Math.abs(valor),
      kind: valor >= 0 ? "receita" : "despesa",
    });
  }
  return rows;
}

export function ImportarTransacoes({ contas }: { contas: Opt[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [nomeArq, setNomeArq] = useState("");
  const [accountId, setAccountId] = useState(contas[0]?.id ?? "");

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setNomeArq(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const parsed = /\.ofx$/i.test(file.name) || /<OFX>/i.test(text)
        ? parseOFX(text)
        : parseCSV(text);
      setRows(parsed);
      if (parsed.length === 0)
        toast.error("Não encontrei lançamentos válidos no arquivo.");
    };
    reader.readAsText(file, "utf-8");
  }

  function confirmar() {
    if (!accountId) {
      toast.error("Escolha a conta de destino.");
      return;
    }
    start(async () => {
      const res = await importTransactions(rows, accountId);
      if (res.ok) {
        toast.success(`${res.count} lançamento(s) importado(s).`);
        setOpen(false);
        setRows([]);
        setNomeArq("");
        router.refresh();
      } else toast.error(res.error ?? "Erro ao importar.");
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setRows([]);
          setNomeArq("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="size-4" />
          Importar extrato
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar extrato</DialogTitle>
          <DialogDescription>
            Arquivo CSV (data, descrição, valor) ou OFX do banco. Valores
            negativos viram despesas; positivos, receitas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center transition hover:bg-muted/50">
            <FileUp className="size-6 text-muted-foreground" />
            <span className="text-sm font-medium">
              {nomeArq || "Escolher arquivo (.csv ou .ofx)"}
            </span>
            <span className="text-xs text-muted-foreground">
              Clique para selecionar
            </span>
            <input
              type="file"
              accept=".csv,.ofx,text/csv"
              className="hidden"
              onChange={onFile}
            />
          </label>

          {rows.length > 0 && (
            <>
              <div className="grid gap-2">
                <Label>Lançar na conta</Label>
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

              <div className="rounded-lg border">
                <div className="border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
                  {rows.length} lançamento(s) — prévia
                </div>
                <div className="max-h-56 overflow-y-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      {rows.slice(0, 50).map((r, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-3 py-1.5 text-muted-foreground">
                            {r.date}
                          </td>
                          <td className="max-w-[220px] truncate px-3 py-1.5">
                            {r.description}
                          </td>
                          <td
                            className={
                              "px-3 py-1.5 text-right font-mono " +
                              (r.kind === "receita"
                                ? "text-emerald-600 dark:text-emerald-500"
                                : "text-destructive")
                            }
                          >
                            {r.kind === "receita" ? "+" : "−"}
                            {formatBRL(r.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={confirmar}
            disabled={pending || rows.length === 0}
            className="w-full"
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            Importar {rows.length > 0 ? `${rows.length} lançamento(s)` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
