"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { syncFiiDividends } from "@/lib/actions";

export function SincronizarProventos() {
  const [pending, startTransition] = useTransition();
  return (
    <Button variant="outline" disabled={pending} onClick={() => startTransition(async () => {
      const result = await syncFiiDividends();
      if (result.ok) toast.success(`${result.imported} provento(s) sincronizado(s).`);
      else toast.error(result.error ?? "Não foi possível sincronizar os proventos.");
    })}>
      <RefreshCw className={pending ? "animate-spin" : ""} />
      {pending ? "Sincronizando..." : "Atualizar proventos"}
    </Button>
  );
}
