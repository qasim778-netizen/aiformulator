import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Trash2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { queryClient, apiRequest } from '@/lib/queryClient'
import type { UserFormulationRequest } from '@shared/schema'

export default function GeneratedFormulasTab() {
  const [selectedRequest, setSelectedRequest] = useState<UserFormulationRequest | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const { toast } = useToast()

  const { data: requests = [], isLoading } = useQuery<UserFormulationRequest[]>({
    queryKey: ['/api/admin/user-formulations'],
    queryFn: async () => {
      const response = await fetch('/api/admin/user-formulations')
      if (!response.ok) throw new Error('Failed to fetch formulations')
      return response.json()
    },
  })

  const deleteRequest = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/admin/user-formulations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/user-formulations'] })
      toast({ title: 'Formulation request deleted successfully' })
      setDetailsOpen(false)
    },
    onError: () => {
      toast({ title: 'Failed to delete request', variant: 'destructive' })
    },
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest('PATCH', `/api/admin/user-formulations/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/user-formulations'] })
      toast({ title: 'Status updated successfully' })
    },
    onError: () => {
      toast({ title: 'Failed to update status', variant: 'destructive' })
    },
  })

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

  if (requests.length === 0) {
    return (
      <Card className="bg-white rounded-lg shadow-md">
        <CardContent className="p-12 text-center">
          <p className="text-gray-500 text-lg">No customer-generated formulation requests yet</p>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {requests.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{request.productName}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{request.productCategory}</td>
                <td className="px-6 py-4">
                  <Badge className={`${getStatusColor(request.status)} border-0`}>
                    {request.status?.charAt(0).toUpperCase() + request.status?.slice(1)}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedRequest(request)
                      setDetailsOpen(true)
                    }}
                    data-testid="button-view-request"
                  >
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRequest.mutate(request.id)}
                    disabled={deleteRequest.isPending}
                    className="text-red-600 hover:text-red-800"
                    data-testid="button-delete-request"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRequest?.productName}</DialogTitle>
            <DialogDescription>{selectedRequest?.productCategory}</DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Customer Information</h3>
                <div className="space-y-2">
                  <p className="text-sm"><strong>Name:</strong> {selectedRequest.customerName || 'Not provided'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Badge className={`${getStatusColor(selectedRequest.status)} mt-1 inline-block`}>
                    {selectedRequest.status?.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Date</label>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Product Details</label>
                <div className="bg-gray-50 p-3 rounded text-sm text-gray-600 space-y-1">
                  <p><strong>Consistency:</strong> {selectedRequest.consistencyType || 'Not specified'}</p>
                  <p><strong>Viscosity:</strong> {selectedRequest.viscosity || 'Not specified'}</p>
                  <p><strong>pH Level:</strong> {selectedRequest.phLevel || 'Not specified'}</p>
                  <p><strong>Shelf Life:</strong> {selectedRequest.shelfLife || 'Not specified'}</p>
                  <p><strong>Budget:</strong> {selectedRequest.budgetCategory || 'Not specified'}</p>
                  <p><strong>Volume:</strong> {selectedRequest.productionVolume || 'Not specified'}</p>
                </div>
              </div>

              {selectedRequest.additionalNotes && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Additional Notes</label>
                  <p className="bg-gray-50 p-3 rounded text-sm text-gray-600">{selectedRequest.additionalNotes}</p>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setDetailsOpen(false)}
                  data-testid="button-close-details"
                >
                  Close
                </Button>
                {selectedRequest.status !== 'approved' && (
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => updateStatus.mutate({ id: selectedRequest.id, status: 'approved' })}
                    disabled={updateStatus.isPending}
                    data-testid="button-approve-request"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                )}
                {selectedRequest.status !== 'rejected' && (
                  <Button
                    variant="destructive"
                    onClick={() => updateStatus.mutate({ id: selectedRequest.id, status: 'rejected' })}
                    disabled={updateStatus.isPending}
                    data-testid="button-reject-request"
                  >
                    Reject
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
