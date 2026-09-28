import { CalendarDays, CircleDollarSign, Clock3, WalletCards } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { SincronizarProventos } from "@/components/forms/sincronizar-proventos";
import { ProventosVisao } from "@/components/proventos-visao";
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
        <StatCard titulo="Recebidos" valor={formatBRL(data.recebidos)} icon={WalletCards} tom="positivo" sensitive />
        <StatCard titulo="A receber" valor={formatBRL(data.aReceber)} icon={Clock3} sensitive />
        <StatCard titulo="Últimos 12 meses" valor={formatBRL(data.ultimos12Meses)} icon={CircleDollarSign} tom="positivo" sensitive />
        <StatCard titulo="Eventos cadastrados" valor={String(data.eventos.length)} icon={CalendarDays} />
      </div>

      <ProventosVisao
        years={data.anosDisponiveis}
        receivedEvents={data.recebidosEventos}
        futureEvents={data.aReceberEventos}
      />
      <p className="text-xs text-muted-foreground">Proventos recebidos usam a quantidade registrada na data-com. Sem anúncio futuro na fonte, a previsão usa a média de até três pagamentos recentes por cota (dados da fonte ou lançamentos registrados) aplicada à quantidade atual; é uma estimativa e pode mudar. O DY exibido nos FIIs usa apenas os proventos registrados; complete o histórico para aproximá-lo do acumulado real de 12 meses.</p>
    </div>
  );
}
