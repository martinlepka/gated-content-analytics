'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { PersonaSummary } from '@/lib/supabase'

interface PersonaBarChartProps {
  data: PersonaSummary[]
}

// Colors mapped to persona scoring tiers
const PERSONA_COLORS: Record<string, string> = {
  'CFO': '#059669',           // green (top tier)
  'VP Finance': '#10b981',    // emerald
  'Controller': '#0891b2',    // cyan
  'FP&A': '#06b6d4',          // light cyan
  'Finance Director': '#7c3aed', // purple
  'Analytics Lead': '#8b5cf6',   // violet
  'CEO': '#db2777',           // magenta
  'COO': '#ec4899',           // pink
  'CTO': '#f97316',           // orange
  'CIO': '#fb923c',           // light orange
  'CDO': '#eab308',           // yellow
  'Founder/Owner': '#84cc16', // lime
  'VP/Director': '#6366f1',   // indigo
  'Manager/Head': '#a855f7',  // purple
  'Finance (Other)': '#64748b', // slate
  'Data/Analytics': '#475569',  // dark slate
  'Other': '#9ca3af',         // gray
  'Unknown': '#d1d5db',       // light gray
}

const FALLBACK_COLORS = [
  '#0891b2', '#7c3aed', '#db2777', '#059669', '#ea580c',
  '#6b7280', '#f59e0b', '#10b981', '#6366f1', '#ec4899'
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
                fill={PERSONA_COLORS[entry.persona] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
