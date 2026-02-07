'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendData } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'

interface TrendChartProps {
  data: TrendData[]
}

export function TrendChart({ data }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center text-gray-400 font-cyber text-[10px] tracking-wider">
        No trend data
      </div>
    )
  }

  const formattedData = data.map(item => ({
    ...item,
    dateFormatted: format(parseISO(item.date), 'MM/dd'),
  }))

  return (
    <div className="h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0891b2" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#0891b2" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="dateFormatted"
            tick={{ fontSize: 10, fill: '#6b7280', fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#6b7280', fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={false}
            width={30}
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
            itemStyle={{ color: '#0891b2', fontSize: 12, fontFamily: 'JetBrains Mono' }}
          />
          <Area
            type="monotone"
            dataKey="downloads"
            stroke="#0891b2"
            strokeWidth={2}
            fill="url(#areaGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
