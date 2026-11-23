"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { naira } from "@/lib/format"

export function SalesChart({ data }: { data: { date: string; revenueKobo: number; orders: number }[] }) {
  const rows = data.map((d) => ({
    ...d,
    label: new Date(`${d.date}T12:00:00Z`).toLocaleDateString("en-NG", { day: "numeric", month: "short" }),
    naira: d.revenueKobo / 100,
  }))

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} interval="preserveStartEnd" stroke="var(--muted-foreground)" />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={11}
            width={52}
            stroke="var(--muted-foreground)"
            tickFormatter={(v: number) => (v >= 1_000_000 ? `₦${(v / 1_000_000).toFixed(1)}m` : v >= 1000 ? `₦${Math.round(v / 1000)}k` : `₦${v}`)}
          />
          <Tooltip
            cursor={{ fill: "var(--accent)" }}
            contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}
            formatter={(_value, _name, item) => [
              `${naira((item.payload as { revenueKobo: number }).revenueKobo)} · ${(item.payload as { orders: number }).orders} orders`,
              "Sales",
            ]}
          />
          <Bar dataKey="naira" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
