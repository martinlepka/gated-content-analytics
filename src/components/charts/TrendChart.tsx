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
      <div className="h-[180px] flex items-center justify-center text-cyan-500/30 font-cyber text-[10px] tracking-wider">
        NO TREND DATA
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
              <stop offset="0%" stopColor="#00ffff" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#00ffff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="dateFormatted"
            tick={{ fontSize: 8, fill: 'rgba(0,255,255,0.4)', fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(0,255,255,0.15)' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 8, fill: 'rgba(0,255,255,0.4)', fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={false}
            width={25}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(5,10,20,0.95)',
              border: '1px solid rgba(0,255,255,0.3)',
              borderRadius: '2px',
              boxShadow: '0 0 20px rgba(0,255,255,0.2)',
              padding: '8px',
            }}
            labelStyle={{ color: 'rgba(0,255,255,0.6)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
            itemStyle={{ color: '#00ffff', fontSize: 10, fontFamily: 'JetBrains Mono' }}
          />
          <Area
            type="monotone"
            dataKey="downloads"
            stroke="#00ffff"
            strokeWidth={2}
            fill="url(#areaGradient)"
            style={{ filter: 'drop-shadow(0 0 4px rgba(0,255,255,0.5))' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
