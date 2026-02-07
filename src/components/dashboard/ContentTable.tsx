import { ContentSummary } from '@/lib/supabase'

interface ContentTableProps {
  content: ContentSummary[]
}

export function ContentTable({ content }: ContentTableProps) {
  if (content.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No content data available
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <th className="pb-3">Content</th>
            <th className="pb-3 text-right">Downloads</th>
            <th className="pb-3 text-right">Quality</th>
            <th className="pb-3 text-right">Converted</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {content.map((item, index) => (
            <tr key={index} className="text-sm">
              <td className="py-3 pr-4">
                <span className="font-medium text-gray-900 truncate max-w-[200px] block">
                  {item.content_name}
                </span>
              </td>
              <td className="py-3 text-right text-gray-600">
                {item.downloads}
              </td>
              <td className="py-3 text-right">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  item.quality_pct >= 40 ? 'bg-green-100 text-green-800' :
                  item.quality_pct >= 20 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.quality_pct}%
                </span>
              </td>
              <td className="py-3 text-right text-gray-600">
                {item.converted_pct}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
