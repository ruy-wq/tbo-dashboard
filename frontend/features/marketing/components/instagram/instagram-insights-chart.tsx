"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared";
import { IconChartLine } from "@tabler/icons-react";
import type { MetaInstagramInsight } from "../../types/instagram";

interface Props {
  insights: MetaInstagramInsight[];
  isLoading: boolean;
}

export function InstagramInsightsChart({ insights, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={IconChartLine}
            title="Sem dados de insights"
            description="Sincronize a conta para ver o grafico de evolucao."
          />
        </CardContent>
      </Card>
    );
  }

  const chartData = insights.map((i) => ({
    date: new Date(i.date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    }),
    Seguidores: i.followers,
    Alcance: i.reach,
    Engajamento: i.total_interactions,
    Impressoes: i.impressions,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <IconChartLine className="size-4 text-muted-foreground" />
          Evolucao de metricas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart
            data={chartData}
            margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
          >
            <defs>
              <linearGradient id="gradReach" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradEngagement" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradFollowers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
              }
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid rgba(0,0,0,0.1)",
                fontSize: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
              formatter={(value: number) => value.toLocaleString("pt-BR")}
            />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            <Area
              type="monotone"
              dataKey="Alcance"
              stroke="#8b5cf6"
              fill="url(#gradReach)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="Engajamento"
              stroke="#ef4444"
              fill="url(#gradEngagement)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="Impressoes"
              stroke="#f59e0b"
              fill="transparent"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
