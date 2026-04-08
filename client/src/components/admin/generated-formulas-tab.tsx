import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 10

function Pagination({ total, page, onPage }: { total: number; page: number; onPage: (p: number) => void }) {
  const totalPages = Math.ceil(total / PAGE_SIZE)
  if (totalPages <= 1) return null
  const from = (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)
  return (
    <div className="flex items-center justify-between pt-4 border-t mt-2">
      <span className="text-sm text-gray-500">Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPage(page - 1)} className="h-8 w-8 p-0">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce<(number | '…')[]>((acc, p, idx, arr) => {
            if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…')
            acc.push(p)
            return acc
          }, [])
          .map((p, i) =>
            p === '…' ? (
              <span key={`e${i}`} className="px-1 text-gray-400 text-sm">…</span>
            ) : (
              <Button key={p} variant={p === page ? 'default' : 'outline'} size="sm" onClick={() => onPage(p as number)} className="h-8 w-8 p-0 text-xs">
                {p}
              </Button>
            )
          )}
        <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => onPage(page + 1)} className="h-8 w-8 p-0">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default function GeneratedFormulasTab() {
  const [page, setPage] = useState(1)

  const { data: requestsData, isLoading, error } = useQuery({
    queryKey: ['/api/admin/user-formulations'],
    queryFn: async () => {
      const response = await fetch('/api/admin/user-formulations')
      if (!response.ok) throw new Error('Failed to fetch formulations')
      return response.json()
    },
  })

  const requests = Array.isArray(requestsData) ? requestsData : []
  const paged = requests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isLoading && requests.length === 0) {
    return (
      <Card className="bg-white rounded-lg shadow-md">
        <CardContent className="p-12 text-center">
          <p className="text-gray-500 text-lg">No customer-generated formulation requests yet</p>
          {error && <p className="text-red-500 text-sm mt-2">{(error as Error)?.message}</p>}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Customer Generated Formulas</h2>
          <p className="text-sm text-gray-600 mt-1">View and manage formulation requests from customers</p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">{requests.length} Requests</Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paged.map((request: any) => {
              const userEmail = request.user_email || request.email || 'Guest'
              const productName = request.productName || request.product_name || 'Unknown'
              const category = request.product_category || request.productCategory || 'N/A'
              const status = request.status || 'pending'
              const createdAt = request.createdAt || request.created_at
              return (
                <tr key={request.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium">{userEmail}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{productName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{category}</td>
                  <td className="px-6 py-4">
                    <Badge className={`${getStatusColor(status)} border-0`}>
                      {status?.charAt(0).toUpperCase() + status?.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Pagination total={requests.length} page={page} onPage={setPage} />
    </div>
  )
}
