import { CalendarDays, CircleDollarSign, Clock3, WalletCards } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { SincronizarProventos } from "@/components/forms/sincronizar-proventos";
import { CrescimentoAnualGrafico, ProventosGrafico } from "@/components/proventos-grafico";
import { getProventos } from "@/lib/queries";
import { formatBRL } from "@/lib/format";

export default async function ProventosPage() {
  const data = await getProventos();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proventos</h1>
          <p className="text-muted-foreground">Rendimentos recebidos e previstos da sua carteira.</p>
        </div>
        <SincronizarProventos />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard titulo="Recebidos" valor={formatBRL(data.recebidos)} icon={WalletCards} tom="positivo" />
        <StatCard titulo="A receber" valor={formatBRL(data.aReceber)} icon={Clock3} />
        <StatCard titulo="Últimos 12 meses" valor={formatBRL(data.ultimos12Meses)} icon={CircleDollarSign} tom="positivo" />
        <StatCard titulo="Eventos cadastrados" valor={String(data.eventos.length)} icon={CalendarDays} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Proventos mensais: recebido e estimado</CardTitle><p className="text-sm text-muted-foreground">Estimativas calculadas com base na média dos últimos três rendimentos por cota.</p></CardHeader>
          <CardContent><ProventosGrafico data={data.monthly} /></CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Crescimento anual de proventos</CardTitle>
            <p className="text-sm text-muted-foreground">Anos anteriores mostram valores recebidos; o ano atual inclui estimativas para os meses restantes.</p>
          </CardHeader>
          <CardContent><CrescimentoAnualGrafico data={data.annual} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recebidos</CardTitle></CardHeader>
          <CardContent>
            {data.recebidosEventos.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum provento recebido cadastrado.</p> : (
              <div className="divide-y">
                {data.recebidosEventos.map((event) => <div key={event.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div><p className="font-medium">{event.ticker}</p><p className="text-muted-foreground">Pagamento em {event.date.toLocaleDateString("pt-BR")}</p></div>
                  <span className="font-semibold text-emerald-600">{formatBRL(event.amount)}</span>
                </div>)}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2">A receber <Badge variant="secondary">previsão</Badge></CardTitle></CardHeader>
          <CardContent>
            {data.aReceberEventos.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum pagamento futuro confirmado pela fonte.</p> : (
              <div className="divide-y">
                {data.aReceberEventos.map((event) => <div key={event.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div><p className="font-medium">{event.ticker}{event.estimated ? <Badge variant="outline" className="ml-2">estimativa</Badge> : <Badge variant="secondary" className="ml-2">confirmado</Badge>}</p><p className="text-muted-foreground">{event.estimated ? "Data estimada" : "Pagamento"}: {event.date.toLocaleDateString("pt-BR")}{event.perShare ? ` · ${formatBRL(event.perShare)}/cota` : ""}</p></div>
                  <span className="font-semibold">{formatBRL(event.amount)}</span>
                </div>)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Histórico detalhado</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="py-2">Ativo</th><th className="py-2">Data</th><th className="py-2 text-right">Valor</th><th className="py-2 text-right">Status</th></tr></thead><tbody>
            {data.eventos.map((event) => <tr key={event.id} className="border-b last:border-0"><td className="py-2 font-medium">{event.ticker}</td><td className="py-2">{event.date.toLocaleDateString("pt-BR")}</td><td className="py-2 text-right">{formatBRL(event.amount)}</td><td className="py-2 text-right">{event.estimated ? "Estimativa" : event.date > new Date() ? "Confirmado" : "Recebido"}</td></tr>)}
          </tbody></table></div>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">Proventos recebidos usam a quantidade registrada na data-com. Pagamentos ainda não anunciados são estimativas baseadas na média dos três últimos rendimentos por cota e podem mudar.</p>
    </div>
  );
}
