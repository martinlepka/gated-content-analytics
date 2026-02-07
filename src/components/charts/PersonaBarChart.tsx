'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { PersonaSummary } from '@/lib/supabase'

interface PersonaBarChartProps {
  data: PersonaSummary[]
}

const COLORS = [
  '#00ffff', // cyan
  '#9933ff', // purple
  '#ff0080', // magenta
  '#00ff88', // green
  '#ff8800', // orange
  '#666666', // gray
]

export function PersonaBarChart({ data }: PersonaBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center text-cyan-500/30 font-cyber text-[10px] tracking-wider">
        NO PERSONA DATA
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
            tick={{ fontSize: 8, fill: 'rgba(0,255,255,0.4)', fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(0,255,255,0.15)' }}
          />
          <YAxis
            dataKey="persona"
            type="category"
            tick={{ fontSize: 9, fill: 'rgba(0,255,255,0.7)', fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={false}
            width={70}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(5,10,20,0.95)',
              border: '1px solid rgba(0,255,255,0.3)',
              borderRadius: '2px',
              boxShadow: '0 0 20px rgba(0,255,255,0.2)',
              padding: '8px',
            }}
            labelStyle={{ color: 'rgba(0,255,255,0.8)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            itemStyle={{ color: 'rgba(0,255,255,0.6)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
            formatter={(value: number, name, props) => [`${value} (${props.payload.pct}%)`, 'SIGNALS']}
          />
          <Bar dataKey="downloads" radius={[0, 2, 2, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                style={{ filter: `drop-shadow(0 0 3px ${COLORS[index % COLORS.length]}80)` }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
