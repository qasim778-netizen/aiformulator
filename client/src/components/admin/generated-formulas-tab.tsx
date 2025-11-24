import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { UserFormulationRequest } from '@shared/schema'

export default function GeneratedFormulasTab() {
  const { data: requestsData, isLoading, error } = useQuery({
    queryKey: ['/api/admin/user-formulations'],
    queryFn: async () => {
      const response = await fetch('/api/admin/user-formulations')
      if (!response.ok) throw new Error('Failed to fetch formulations')
      const data = await response.json()
      console.log('GeneratedFormulasTab received data:', data, 'Type:', Array.isArray(data) ? 'array' : typeof data)
      return data
    },
  })
  
  const requests = Array.isArray(requestsData) ? requestsData : []

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
          {error && <p className="text-red-500 text-sm mt-2">{error?.message}</p>}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {requests.map((request: any) => {
              const productName = request.productName || request.product_name || 'Unknown'
              const status = request.status || 'pending'
              const createdAt = request.createdAt || request.created_at
              return (
                <tr key={request.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm text-gray-600">{productName}</td>
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

    </div>
  )
}
