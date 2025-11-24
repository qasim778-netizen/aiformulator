import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Clock, Eye, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { UserFormulationRequest } from "@shared/schema";

export default function UserFormulationRequests() {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  // Force cache invalidation on component mount
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/user-formulation-requests"] });
  }, []);

  const { data: requestsData, isLoading, error } = useQuery<{
    data: UserFormulationRequest[];
    pagination: { currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number };
  }>({
    queryKey: ["/api/admin/user-formulation-requests", currentPage, statusFilter],
    queryFn: async () => {
      const statusParam = statusFilter !== "all" ? `&status=${statusFilter}` : "";
      const response = await fetch(`/api/admin/user-formulation-requests?page=${currentPage}&limit=10${statusParam}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch user formulation requests: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 0, // Always refetch
    gcTime: 0, // Don't cache
  });

  const deleteRequest = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/user-formulation-requests/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-formulation-requests"] });
      toast({ title: "Request deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete request", variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Pending
        </Badge>;
      case "reviewed":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Eye className="h-3 w-3 mr-1" />
          Reviewed
        </Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-600 mb-2">Error Loading Requests</h3>
          <p className="text-gray-500">{error.message}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const requests = requestsData?.data || [];
  const pagination = requestsData?.pagination;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Label htmlFor="status-filter" className="text-sm font-medium">Filter by status:</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48" id="status-filter">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No user requests found</h3>
            <p className="text-gray-500">
              {statusFilter === "all" 
                ? "No users have submitted formulation requests yet." 
                : `No requests found with status: ${statusFilter}`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{request.productName}</h3>
                      {getStatusBadge(request.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label className="text-sm text-gray-600">Category</Label>
                        <p className="text-sm font-medium">{request.productCategory}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Consistency Type</Label>
                        <p className="text-sm font-medium">{request.consistencyType || "Not specified"}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Budget Category</Label>
                        <p className="text-sm font-medium">{request.budgetCategory || "Not specified"}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Production Volume</Label>
                        <p className="text-sm font-medium">{request.productionVolume || "Not specified"}</p>
                      </div>
                    </div>

                    {request.specialProperties && (
                      <div className="mb-4">
                        <Label className="text-sm text-gray-600">Special Properties</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {(request.specialProperties as string[]).map((property, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {property}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {request.additionalNotes && (
                      <div className="mb-4">
                        <Label className="text-sm text-gray-600">Additional Notes</Label>
                        <p className="text-sm text-gray-700 mt-1">{request.additionalNotes}</p>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        Session: {request.sessionId.slice(0, 8)}...
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRequest.mutate(request.id)}
                      disabled={deleteRequest.isPending}
                      data-testid={`button-delete-request-${request.id}`}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {pagination.itemsPerPage * (pagination.currentPage - 1) + 1} to{" "}
            {Math.min(pagination.itemsPerPage * pagination.currentPage, pagination.totalItems)} of{" "}
            {pagination.totalItems} requests
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={pagination.currentPage === 1}
            >
              Previous
            </Button>
            
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = i + Math.max(1, Math.min(pagination.currentPage - 2, pagination.totalPages - 4));
              if (pageNum <= pagination.totalPages) {
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === pagination.currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              }
              return null;
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}