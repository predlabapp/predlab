"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts"

interface CategoryData {
  name: string
  count: number
}

interface ResolutionData {
  name: string
  count: number
  color: string
}

interface Props {
  categoryData: CategoryData[]
  resolutionData: ResolutionData[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs shadow-xl">
        <p className="text-[var(--text-secondary)]">{label ?? payload[0].name}</p>
        <p className="font-mono font-bold text-[var(--text-primary)] mt-0.5">
          {payload[0].value} previsões
        </p>
      </div>
    )
  }
  return null
}

export function StatsCharts({ categoryData, resolutionData }: Props) {
  return (
    <div className="space-y-6">
      {/* Resolution pie */}
      {resolutionData.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
            Distribuição por resultado
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={resolutionData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="count"
                nameKey="name"
              >
                {resolutionData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => (
                  <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category bar chart */}
      {categoryData.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
            Previsões por categoria
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={categoryData}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--accent-glow)" }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {categoryData.map((_, i) => (
                  <Cell key={i} fill="var(--accent)" fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
