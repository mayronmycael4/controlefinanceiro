"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { syncFiiDividends } from "@/lib/actions";

export function SincronizarProventos() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  useEffect(() => {
    const key = "fincontrole:proventos:last-sync";
    const lastSync = Number(window.localStorage.getItem(key) ?? 0);
    if (Date.now() - lastSync < 6 * 60 * 60 * 1000) return;
    window.localStorage.setItem(key, String(Date.now()));
    syncFiiDividends().then((result) => {
      if (result.ok) {
        window.localStorage.setItem(key, String(Date.now()));
        router.refresh();
      } else {
        window.localStorage.removeItem(key);
      }
    }).catch(() => window.localStorage.removeItem(key));
  }, [router]);

  function refresh() {
    startTransition(async () => {
      const result = await syncFiiDividends();
      if (result.ok) {
        window.localStorage.setItem("fincontrole:proventos:last-sync", String(Date.now()));
        toast.success(`${result.imported} provento(s) sincronizado(s).`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Não foi possível sincronizar os proventos.");
      }
    });
  }
  return (
    <Button variant="outline" disabled={pending} onClick={refresh}>
      <RefreshCw className={pending ? "animate-spin" : ""} />
      {pending ? "Sincronizando..." : "Atualizar proventos"}
    </Button>
  );
}
