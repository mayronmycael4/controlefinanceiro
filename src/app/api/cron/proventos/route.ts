import { NextResponse } from "next/server";

import { syncAllFiiDividends } from "@/lib/fii-dividends";

export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { imported } = await syncAllFiiDividends();
    return NextResponse.json({ ok: true, imported, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Falha na sincronização diária de proventos", error);
    return NextResponse.json({ ok: false, error: "Não foi possível sincronizar os proventos." }, { status: 502 });
  }
}
