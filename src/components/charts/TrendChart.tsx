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
      <div className="h-[300px] flex items-center justify-center text-gray-500">
        No trend data available
      </div>
    )
  }

  const formattedData = data.map(item => ({
    ...item,
    dateFormatted: format(parseISO(item.date), 'MMM d'),
    low_quality: item.downloads - item.high_quality,
  }))

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={formattedData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="dateFormatted"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => (
              <span className="text-sm text-gray-600">
                {value === 'high_quality' ? 'High Quality (P0/P1)' : 'Other (P2/P3)'}
              </span>
            )}
          />
          <Area
            type="monotone"
            dataKey="high_quality"
            stackId="1"
            stroke="#22c55e"
            fill="#dcfce7"
            name="high_quality"
          />
          <Area
            type="monotone"
            dataKey="low_quality"
            stackId="1"
            stroke="#94a3b8"
            fill="#f1f5f9"
            name="low_quality"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
