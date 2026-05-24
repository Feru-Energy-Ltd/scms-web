"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { RevenueTrendPoint } from "@/lib/api/reports";

interface Props {
  data: RevenueTrendPoint[];
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function RevenueChart({ data }: Props) {
  const chartData = data.map((d) => ({
    date: fmtDate(d.date),
    "Operator Revenue": d.operatorRevenue,
    "Platform Fees": d.platformFees,
    Sessions: d.sessionCount,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={chartData} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis
          yAxisId="revenue"
          tick={{ fontSize: 12 }}
          tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
        />
        <YAxis yAxisId="sessions" orientation="right" tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value: number, name: string) =>
            name === "Sessions" ? [value, name] : [`RWF ${value.toLocaleString()}`, name]
          }
        />
        <Legend />
        <Bar yAxisId="revenue" dataKey="Operator Revenue" stackId="revenue" fill="#22c55e" radius={[2, 2, 0, 0]} />
        <Bar yAxisId="revenue" dataKey="Platform Fees" stackId="revenue" fill="#f59e0b" radius={[2, 2, 0, 0]} />
        <Line yAxisId="sessions" dataKey="Sessions" type="monotone" stroke="#6366f1" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
