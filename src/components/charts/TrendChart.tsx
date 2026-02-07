'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendData } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'

interface TrendChartProps {
  data: TrendData[]
}

export function TrendChart({ data }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-muted-foreground font-mono text-sm">
        No trend data available
      </div>
    )
  }

  const formattedData = data.map(item => ({
    ...item,
    dateFormatted: format(parseISO(item.date), 'MM/dd'),
    low_quality: item.downloads - item.high_quality,
  }))

  return (
    <div className="h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={formattedData}
          margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="highQualityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="lowQualityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#6b7280" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 20%)" vertical={false} />
          <XAxis
            dataKey="dateFormatted"
            tick={{ fontSize: 10, fill: 'hsl(215 20% 55%)' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(217 33% 20%)' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'hsl(215 20% 55%)' }}
            tickLine={false}
            axisLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(222 47% 9%)',
              border: '1px solid hsl(217 33% 20%)',
              borderRadius: '0.5rem',
              boxShadow: '0 0 20px rgba(0, 212, 255, 0.1)',
            }}
            labelStyle={{ color: 'hsl(215 20% 55%)', fontSize: 11 }}
            itemStyle={{ color: 'hsl(210 40% 98%)', fontSize: 11 }}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend
            verticalAlign="top"
            height={28}
            formatter={(value) => (
              <span className="text-[10px] text-muted-foreground">
                {value === 'high_quality' ? 'P0/P1' : 'P2/P3'}
              </span>
            )}
          />
          <Area
            type="monotone"
            dataKey="high_quality"
            stackId="1"
            stroke="#00d4ff"
            strokeWidth={2}
            fill="url(#highQualityGradient)"
            name="high_quality"
          />
          <Area
            type="monotone"
            dataKey="low_quality"
            stackId="1"
            stroke="#6b7280"
            strokeWidth={1}
            fill="url(#lowQualityGradient)"
            name="low_quality"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
