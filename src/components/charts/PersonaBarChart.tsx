'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { PersonaSummary } from '@/lib/supabase'

interface PersonaBarChartProps {
  data: PersonaSummary[]
}

const COLORS = [
  '#00d4ff', // cyan
  '#9945ff', // purple
  '#ff0080', // magenta
  '#22c55e', // green
  '#f97316', // orange
  '#6b7280', // gray
  '#eab308', // yellow
]

export function PersonaBarChart({ data }: PersonaBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-muted-foreground font-mono text-sm">
        No persona data available
      </div>
    )
  }

  // Take top 6 personas
  const chartData = data.slice(0, 6)

  return (
    <div className="h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 20%)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: 'hsl(215 20% 55%)' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(217 33% 20%)' }}
          />
          <YAxis
            dataKey="persona"
            type="category"
            tick={{ fontSize: 10, fill: 'hsl(210 40% 98%)' }}
            tickLine={false}
            axisLine={false}
            width={75}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(222 47% 9%)',
              border: '1px solid hsl(217 33% 20%)',
              borderRadius: '0.5rem',
              boxShadow: '0 0 20px rgba(0, 212, 255, 0.1)',
            }}
            labelStyle={{ color: 'hsl(210 40% 98%)', fontSize: 11 }}
            itemStyle={{ color: 'hsl(215 20% 55%)', fontSize: 11 }}
            formatter={(value: number, name, props) => [
              `${value} (${props.payload.pct}%)`,
              'Downloads'
            ]}
          />
          <Bar
            dataKey="downloads"
            radius={[0, 4, 4, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                style={{ filter: `drop-shadow(0 0 4px ${COLORS[index % COLORS.length]}40)` }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
