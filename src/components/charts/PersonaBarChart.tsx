'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { PersonaSummary } from '@/lib/supabase'

interface PersonaBarChartProps {
  data: PersonaSummary[]
}

const COLORS = [
  '#0891b2', // cyan
  '#7c3aed', // purple
  '#db2777', // magenta
  '#059669', // green
  '#ea580c', // orange
  '#6b7280', // gray
]

export function PersonaBarChart({ data }: PersonaBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center text-gray-400 font-cyber text-[10px] tracking-wider">
        No persona data
      </div>
    )
  }

  const chartData = data.slice(0, 5)

  return (
    <div className="h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: '#6b7280', fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            dataKey="persona"
            type="category"
            tick={{ fontSize: 11, fill: '#374151', fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={false}
            width={80}
          />
          <Tooltip
            contentStyle={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              padding: '8px 12px',
            }}
            labelStyle={{ color: '#374151', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            itemStyle={{ color: '#6b7280', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            formatter={(value: number, name, props) => [`${value} (${props.payload.pct}%)`, 'Signals']}
          />
          <Bar dataKey="downloads" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
