'use client'

import { useEffect, useState } from 'react'
import { fetchGatedContentAPI } from '@/lib/supabase'
import { FileText, ArrowLeft, Loader2, TrendingUp, Users, Zap } from 'lucide-react'
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
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="h-8 w-8 animate-spin text-neon-cyan" />
            <div className="absolute inset-0 blur-xl bg-neon-cyan/30 animate-pulse" />
          </div>
          <span className="text-muted-foreground font-mono text-sm">LOADING CONTENT DATA...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-p0/50 rounded-lg p-6 max-w-md glow-magenta">
          <h2 className="text-lg font-semibold text-neon-magenta mb-2">System Error</h2>
          <p className="text-muted-foreground font-mono text-sm">{error}</p>
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
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="h-8 w-8 rounded bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                <Zap className="h-4 w-4 text-background" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Content Performance</h1>
                <p className="text-xs text-muted-foreground font-mono">BREAKDOWN BY ASSET</p>
              </div>
            </div>
            <nav className="flex items-center gap-1">
              <Link href="/" className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Overview
              </Link>
              <Link href="/content" className="px-3 py-1.5 text-sm font-medium text-neon-cyan border-b-2 border-neon-cyan">
                Content
              </Link>
              <Link href="/leads" className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Leads
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="stat-card bg-card border border-border rounded-lg p-4 hover:border-neon-cyan/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-neon-cyan" />
              <span className="text-xs text-muted-foreground font-mono uppercase">Content Pieces</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{content.length}</div>
          </div>
          <div className="stat-card bg-card border border-border rounded-lg p-4 hover:border-neon-green/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-neon-green" />
              <span className="text-xs text-muted-foreground font-mono uppercase">Total Downloads</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{totalDownloads}</div>
          </div>
          <div className="stat-card bg-card border border-border rounded-lg p-4 hover:border-neon-purple/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-neon-purple" />
              <span className="text-xs text-muted-foreground font-mono uppercase">Avg Quality Rate</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{avgQuality}%</div>
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Content Name</th>
                  <th className="px-3 py-2 text-right text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Downloads</th>
                  <th className="px-3 py-2 text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wider">P0</th>
                  <th className="px-3 py-2 text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wider">P1</th>
                  <th className="px-3 py-2 text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wider">P2</th>
                  <th className="px-3 py-2 text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wider">P3</th>
                  <th className="px-3 py-2 text-right text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Quality</th>
                  <th className="px-3 py-2 text-right text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Avg Score</th>
                  <th className="px-3 py-2 text-right text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Converted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {content.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground font-mono text-sm">
                      No content data available
                    </td>
                  </tr>
                ) : (
                  content.map((item, index) => (
                    <tr key={index} className="cyber-row">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-foreground">{item.content_name}</span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="text-sm font-mono text-foreground">{item.downloads}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {item.p0 > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-p0-light text-neon-magenta border border-p0/30">
                            {item.p0}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {item.p1 > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-p1-light text-neon-orange border border-p1/30">
                            {item.p1}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {item.p2 > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-p2-light text-neon-cyan border border-p2/30">
                            {item.p2}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {item.p3 > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                            {item.p3}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          item.high_quality_pct >= 40 ? 'bg-neon-green/10 text-neon-green border border-neon-green/30' :
                          item.high_quality_pct >= 20 ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30' :
                          'bg-muted text-muted-foreground border border-border'
                        }`}>
                          {item.high_quality_pct}%
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="text-sm font-mono text-foreground">{item.avg_score}</span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="text-xs text-muted-foreground">
                          {item.converted} <span className="text-neon-green">({item.converted_pct}%)</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
