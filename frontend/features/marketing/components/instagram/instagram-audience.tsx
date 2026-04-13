"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared";
import { IconUsers, IconMapPin, IconGenderBigender } from "@tabler/icons-react";
import type { AudienceData } from "../../types/instagram";

interface Props {
  audience: AudienceData | null;
  isLoading: boolean;
}

const GENDER_COLORS: Record<string, string> = {
  M: "#3b82f6",
  F: "#ec4899",
  U: "#9ca3af",
};

const GENDER_LABELS: Record<string, string> = {
  M: "Masculino",
  F: "Feminino",
  U: "Outro",
};

const AGE_COLORS = ["#8b5cf6", "#6366f1", "#3b82f6", "#06b6d4", "#22c55e", "#84cc16", "#eab308"];

export function InstagramAudience({ audience, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[180px] w-full rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!audience || (!audience.gender && !audience.top_cities && !audience.age_ranges)) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={IconUsers}
            title="Sem dados de audiencia"
            description="Os dados de audiencia serao preenchidos apos a sincronizacao."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Gender */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <IconGenderBigender className="size-4 text-muted-foreground" />
            Genero
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GenderChart gender={audience.gender ?? {}} />
        </CardContent>
      </Card>

      {/* Age */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <IconUsers className="size-4 text-muted-foreground" />
            Faixa etaria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AgeChart ageRanges={audience.age_ranges ?? {}} />
        </CardContent>
      </Card>

      {/* Cities */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <IconMapPin className="size-4 text-muted-foreground" />
            Top cidades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CitiesChart cities={audience.top_cities ?? {}} />
        </CardContent>
      </Card>
    </div>
  );
}

function GenderChart({ gender }: { gender: Record<string, number> }) {
  const entries = Object.entries(gender);
  if (entries.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-8">
        Sem dados disponiveis
      </p>
    );
  }

  const total = entries.reduce((s, [, v]) => s + v, 0);
  const data = entries.map(([key, value]) => ({
    name: GENDER_LABELS[key] ?? key,
    value,
    pct: total > 0 ? ((value / total) * 100).toFixed(1) : "0",
    color: GENDER_COLORS[key] ?? "#9ca3af",
  }));

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={140}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={35}
            outerRadius={55}
            dataKey="value"
            stroke="none"
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [
              `${value.toLocaleString("pt-BR")} (${((value / total) * 100).toFixed(1)}%)`,
              name,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-muted-foreground">{d.name}</span>
            <span className="font-semibold">{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgeChart({ ageRanges }: { ageRanges: Record<string, number> }) {
  const entries = Object.entries(ageRanges).sort(([a], [b]) => {
    const numA = parseInt(a.replace(/[^\d]/g, ""));
    const numB = parseInt(b.replace(/[^\d]/g, ""));
    return numA - numB;
  });

  if (entries.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-8">
        Sem dados disponiveis
      </p>
    );
  }

  const total = entries.reduce((s, [, v]) => s + v, 0);
  const data = entries.map(([range, value]) => ({
    range,
    value,
    pct: total > 0 ? ((value / total) * 100).toFixed(1) : "0",
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis dataKey="range" tick={{ fontSize: 10 }} tickLine={false} />
        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip
          formatter={(value: number) => [
            `${value.toLocaleString("pt-BR")} (${((value / total) * 100).toFixed(1)}%)`,
            "Seguidores",
          ]}
          contentStyle={{ fontSize: "11px", borderRadius: "6px" }}
        />
        <Bar dataKey="value" radius={[3, 3, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={AGE_COLORS[i % AGE_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function CitiesChart({ cities }: { cities: Record<string, number> }) {
  const entries = Object.entries(cities)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  if (entries.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-8">
        Sem dados disponiveis
      </p>
    );
  }

  const maxVal = Math.max(...entries.map(([, v]) => v));
  const total = entries.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="space-y-2">
      {entries.map(([city, count]) => (
        <div key={city} className="space-y-0.5">
          <div className="flex items-center justify-between text-xs">
            <span className="truncate max-w-[140px]" title={city}>
              {city}
            </span>
            <span className="text-muted-foreground font-medium">
              {count.toLocaleString("pt-BR")}{" "}
              <span className="text-muted-foreground/60">
                ({((count / total) * 100).toFixed(1)}%)
              </span>
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
              style={{ width: `${(count / maxVal) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
