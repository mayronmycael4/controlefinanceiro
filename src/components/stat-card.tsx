import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/format";

export function StatCard({
  titulo,
  valor,
  icon: Icon,
  legenda,
  tom = "muted",
  trend,
  trendLabel,
  trendPositivaEhBoa = true,
}: {
  titulo: string;
  valor: string;
  icon: LucideIcon;
  legenda?: string;
  tom?: "muted" | "positivo" | "negativo";
  /** variação percentual vs. período anterior */
  trend?: number;
  trendLabel?: string;
  trendPositivaEhBoa?: boolean;
}) {
  const temTrend = typeof trend === "number" && Number.isFinite(trend);
  const subiu = (trend ?? 0) >= 0;
  const ehBoa = subiu === trendPositivaEhBoa;
  const TrendIcon = subiu ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {titulo}
        </CardTitle>
        <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{valor}</div>
        {temTrend ? (
          <div className="mt-1 flex items-center gap-1 text-xs">
            <span
              className={cn(
                "flex items-center gap-0.5 font-medium",
                ehBoa
                  ? "text-emerald-600 dark:text-emerald-500"
                  : "text-destructive"
              )}
            >
              <TrendIcon className="size-3" />
              {formatPercent(trend!)}
            </span>
            {trendLabel && (
              <span className="text-muted-foreground">{trendLabel}</span>
            )}
          </div>
        ) : (
          legenda && (
            <p
              className={cn(
                "mt-1 text-xs",
                tom === "muted" && "text-muted-foreground",
                tom === "positivo" && "text-emerald-600 dark:text-emerald-500",
                tom === "negativo" && "text-destructive"
              )}
            >
              {legenda}
            </p>
          )
        )}
      </CardContent>
    </Card>
  );
}
