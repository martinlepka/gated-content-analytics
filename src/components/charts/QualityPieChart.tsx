'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface QualityPieChartProps {
  data: { P0: number; P1: number; P2: number; P3: number }
}

const COLORS = {
  P0: '#ef4444', // red
  P1: '#f97316', // orange
  P2: '#eab308', // yellow
  P3: '#6b7280', // gray
}

const LABELS = {
  P0: 'P0 - Immediate',
  P1: 'P1 - High',
  P2: 'P2 - Standard',
  P3: 'P3 - Nurture',
}

export function QualityPieChart({ data }: QualityPieChartProps) {
  const chartData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: LABELS[key as keyof typeof LABELS],
      value,
      tier: key,
    }))

  const total = Object.values(data).reduce((a, b) => a + b, 0)

  if (total === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-500">
        No data available
      </div>
    )
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[entry.tier as keyof typeof COLORS]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [
              `${value} (${Math.round((value / total) * 100)}%)`,
              'Downloads'
            ]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-sm text-gray-600">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
