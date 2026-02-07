'use client'

import { useEffect, useState } from 'react'
import { fetchGatedContentAPI } from '@/lib/supabase'
import { FileText, ArrowLeft, Loader2, TrendingUp, Users } from 'lucide-react'
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading content data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-6 max-w-md">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  const totalDownloads = content.reduce((sum, c) => sum + c.downloads, 0)
  const avgQuality = content.length > 0
    ? Math.round(content.reduce((sum, c) => sum + c.high_quality_pct, 0) / content.length)
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-400 hover:text-gray-600">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Content Performance</h1>
                <p className="text-sm text-gray-500 mt-1">Breakdown by gated content piece</p>
              </div>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">Overview</Link>
              <Link href="/content" className="text-sm font-medium text-blue-600">Content</Link>
              <Link href="/leads" className="text-sm font-medium text-gray-600 hover:text-gray-900">Leads</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Content Pieces</p>
                <p className="text-2xl font-bold text-gray-900">{content.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Downloads</p>
                <p className="text-2xl font-bold text-gray-900">{totalDownloads}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Quality Rate</p>
                <p className="text-2xl font-bold text-gray-900">{avgQuality}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Content</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Content Name</th>
                  <th className="px-6 py-3 text-right">Downloads</th>
                  <th className="px-6 py-3 text-center">P0</th>
                  <th className="px-6 py-3 text-center">P1</th>
                  <th className="px-6 py-3 text-center">P2</th>
                  <th className="px-6 py-3 text-center">P3</th>
                  <th className="px-6 py-3 text-right">Quality %</th>
                  <th className="px-6 py-3 text-right">Avg Score</th>
                  <th className="px-6 py-3 text-right">Converted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {content.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      No content data available
                    </td>
                  </tr>
                ) : (
                  content.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{item.content_name}</span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600">
                        {item.downloads}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.p0 > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            {item.p0}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.p1 > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                            {item.p1}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.p2 > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            {item.p2}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.p3 > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {item.p3}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          item.high_quality_pct >= 40 ? 'bg-green-100 text-green-800' :
                          item.high_quality_pct >= 20 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.high_quality_pct}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600">
                        {item.avg_score}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600">
                        {item.converted} ({item.converted_pct}%)
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
