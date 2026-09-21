"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { refreshStaleFiiPrices } from "@/lib/actions";

export function AtualizacaoAutomaticaFii({ enabled }: { enabled: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    const key = "fincontrole:fii-prices:last-check";
    const lastCheck = Number(localStorage.getItem(key) ?? 0);
    if (Date.now() - lastCheck < 24 * 60 * 60 * 1000) return;

    localStorage.setItem(key, String(Date.now()));
    refreshStaleFiiPrices().then((result) => {
      if (result.ok) router.refresh();
    }).catch(() => {
      // A atualização automática não deve impedir o uso da carteira.
    });
  }, [enabled, router]);

  return null;
}
