import {
  AlertTriangle,
  CreditCard,
  TrendingUp,
  Clock,
  PieChart,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Insight } from "@/lib/queries";

const ICONS: Record<Insight["kind"], LucideIcon> = {
  budget: AlertTriangle,
  card: CreditCard,
  trend: TrendingUp,
  pending: Clock,
  top: PieChart,
};

const TONE = {
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  positive:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  info: "bg-muted text-muted-foreground",
};

export function InsightsPanel({ insights }: { insights: Insight[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="size-5 text-muted-foreground" />
          Insights
        </CardTitle>
        <CardDescription>Alertas e destaques do mês</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {insights.length === 0 ? (
          <div className="flex h-20 items-center justify-center text-sm text-muted-foreground sm:col-span-2">
            Tudo tranquilo por aqui. 👌
          </div>
        ) : (
          insights.map((ins, i) => {
            const Icon = ICONS[ins.kind];
            return (
              <div key={i} className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg",
                    TONE[ins.tone]
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium">{ins.titulo}</div>
                  <div className="text-sm text-muted-foreground">
                    {ins.descricao}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
