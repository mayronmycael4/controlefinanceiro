"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { TxRow } from "@/components/transacoes-table";

function formatDataISO(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const off = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - off).toISOString().slice(0, 10);
}

// Campo CSV seguro (aspas + escape)
function campo(v: string) {
  return `"${String(v).replace(/"/g, '""')}"`;
}

export function ExportarTransacoes({
  items,
  nomeArquivo = "transacoes",
}: {
  items: TxRow[];
  nomeArquivo?: string;
}) {
  function exportar() {
    const header = [
      "Data",
      "Descrição",
      "Tipo",
      "Categoria",
      "Pagamento",
      "Status",
      "Etiquetas",
      "Valor",
    ];
    const linhas = items.map((t) => {
      const valor = (t.kind === "receita" ? t.amount : -t.amount)
        .toFixed(2)
        .replace(".", ",");
      const pagamento = t.creditCard?.name ?? t.account?.name ?? "";
      return [
        formatDataISO(t.date),
        campo(t.description),
        t.kind === "receita" ? "Receita" : "Despesa",
        campo(t.category?.name ?? ""),
        campo(pagamento),
        t.status === "pago" ? "Pago" : "Pendente",
        campo((t.tags ?? "").split(",").filter(Boolean).join(" ")),
        valor,
      ].join(";");
    });
    // BOM para o Excel reconhecer UTF-8; separador ";" (padrão pt-BR)
    const csv = "﻿" + [header.join(";"), ...linhas].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nomeArquivo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" onClick={exportar} disabled={items.length === 0}>
      <Download className="size-4" />
      Exportar CSV
    </Button>
  );
}
