'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { PersonaSummary } from '@/lib/supabase'

interface PersonaBarChartProps {
  data: PersonaSummary[]
}

const COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#6b7280', // gray
]

export function PersonaBarChart({ data }: PersonaBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-500">
        No persona data available
      </div>
    )
  }

  // Take top 7 personas
  const chartData = data.slice(0, 7)

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            dataKey="persona"
            type="category"
            tick={{ fontSize: 12, fill: '#374151' }}
            tickLine={false}
            axisLine={false}
            width={75}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            formatter={(value: number, name, props) => [
              `${value} downloads (${props.payload.pct}%)`,
              'Downloads'
            ]}
          />
          <Bar
            dataKey="downloads"
            radius={[0, 4, 4, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
