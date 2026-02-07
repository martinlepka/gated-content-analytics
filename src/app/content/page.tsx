'use client'

import { useEffect, useState } from 'react'
import { fetchGatedContentAPI } from '@/lib/supabase'
import { FileText, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'

interface ContentData {
  content_name: string
  downloads: number
  p0: number
  p1: number
  p2: number
  p3: number
  high_quality_pct: number
  avg_score: number
  converted: number
  converted_pct: number
}

export default function ContentPage() {
  const [content, setContent] = useState<ContentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const data = await fetchGatedContentAPI('content-summary')
        setContent(data.content || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="cyber-loader" />
          <span className="text-[10px] text-cyan-500/50 font-cyber tracking-wider">LOADING.CONTENT</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="cyber-card p-6 max-w-md text-center">
          <div className="text-neon-magenta font-cyber text-sm mb-2">SYSTEM.ERROR</div>
          <p className="text-[11px] text-cyan-500/60">{error}</p>
        </div>
      </div>
    )
  }

  const totalDownloads = content.reduce((sum, c) => sum + c.downloads, 0)
  const avgQuality = content.length > 0
    ? Math.round(content.reduce((sum, c) => sum + c.high_quality_pct, 0) / content.length)
    : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="cyber-header sticky top-0 z-40 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-cyber text-sm text-neon-cyan text-glow-sm tracking-wider hover:text-neon-cyan/80">
              SIGNAL.ANALYTICS
            </Link>
            <span className="text-cyan-500/30">|</span>
            <span className="text-[10px] text-cyan-500/60 tracking-wider">CONTENT.METRICS</span>
          </div>
          <nav className="flex items-center gap-1">
            <Link href="/" className="nav-link text-cyan-500/50">OVERVIEW</Link>
            <Link href="/content" className="nav-link active">CONTENT</Link>
            <Link href="/leads" className="nav-link text-cyan-500/50">LEADS</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="cyber-stat p-3">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-3 w-3 text-cyan-500/50" />
              <span className="text-[8px] text-cyan-500/40 tracking-wider">ASSETS</span>
            </div>
            <div className="font-cyber text-2xl text-neon-cyan text-glow">{content.length}</div>
          </div>
          <div className="cyber-stat p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3 w-3 text-cyan-500/50" />
              <span className="text-[8px] text-cyan-500/40 tracking-wider">DOWNLOADS</span>
            </div>
            <div className="font-cyber text-2xl text-neon-green text-glow">{totalDownloads}</div>
          </div>
          <div className="cyber-stat p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-3 w-3 text-cyan-500/50" />
              <span className="text-[8px] text-cyan-500/40 tracking-wider">AVG QUALITY</span>
            </div>
            <div className="font-cyber text-2xl text-neon-purple text-glow">{avgQuality}%</div>
          </div>
        </div>

        {/* Content Table */}
        <div className="cyber-table overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">CONTENT</th>
                <th className="w-[70px]">DL</th>
                <th className="w-[45px]">P0</th>
                <th className="w-[45px]">P1</th>
                <th className="w-[45px]">P2</th>
                <th className="w-[45px]">P3</th>
                <th className="w-[70px]">QUALITY</th>
                <th className="w-[60px]">AVG</th>
                <th className="w-[80px]">CONV</th>
              </tr>
            </thead>
            <tbody>
              {content.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-cyan-500/30 font-cyber text-[10px] tracking-wider">
                    NO.CONTENT.DATA
                  </td>
                </tr>
              ) : (
                content.map((item, index) => (
                  <tr key={index} className="cyber-row">
                    <td>
                      <span className="text-[11px] text-cyan-300 truncate block max-w-[200px]" title={item.content_name}>
                        {item.content_name}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="font-cyber text-sm text-neon-cyan">{item.downloads}</span>
                    </td>
                    <td className="text-center">
                      {item.p0 > 0 && (
                        <span className="tier-p0 inline-block px-1.5 py-0.5 text-[9px] font-bold">
                          {item.p0}
                        </span>
                      )}
                    </td>
                    <td className="text-center">
                      {item.p1 > 0 && (
                        <span className="tier-p1 inline-block px-1.5 py-0.5 text-[9px] font-bold">
                          {item.p1}
                        </span>
                      )}
                    </td>
                    <td className="text-center">
                      {item.p2 > 0 && (
                        <span className="tier-p2 inline-block px-1.5 py-0.5 text-[9px] font-bold">
                          {item.p2}
                        </span>
                      )}
                    </td>
                    <td className="text-center">
                      {item.p3 > 0 && (
                        <span className="tier-p3 inline-block px-1.5 py-0.5 text-[9px] font-bold">
                          {item.p3}
                        </span>
                      )}
                    </td>
                    <td className="text-center">
                      <span className={`text-[10px] font-bold ${
                        item.high_quality_pct >= 40 ? 'text-neon-green' :
                        item.high_quality_pct >= 20 ? 'text-neon-cyan' :
                        'text-cyan-500/40'
                      }`}>
                        {item.high_quality_pct}%
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="text-[11px] text-cyan-500/60 font-mono">{item.avg_score}</span>
                    </td>
                    <td className="text-center">
                      <span className="text-[10px] text-cyan-500/50">
                        {item.converted}
                        <span className="text-neon-green ml-1">({item.converted_pct}%)</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
