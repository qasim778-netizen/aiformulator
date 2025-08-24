import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings, Eye, Check, X, Trash2, Calendar, DollarSign, Beaker } from "lucide-react";
import type { AiFormulation } from "@shared/schema";

interface FormulationDetails {
  name: string;
  description: string;
  ingredients: Array<{
    name: string;
    percentage: number;
    function: string;
    supplier?: string;
    cost?: number;
  }>;
  manufacturingProcess: Array<{
    step: number;
    instruction: string;
    temperature?: string;
    duration?: string;
    equipment?: string;
  }>;
  properties: {
    viscosity: string;
    phLevel: string;
    appearance: string;
    shelfLife: string;
    storageConditions: string;
  };
  costAnalysis: {
    totalCostPerKg: number;
    budgetCategory: string;
    profitability: string;
    ingredientCosts?: Array<{
      ingredient: string;
      costPerKg: number;
      percentage: number;
    }>;
  };
  qualityControl?: Array<{
    parameter: string;
    specification: string;
    testMethod: string;
  }>;
  safetyConsiderations?: Array<{
    hazard: string;
    precaution: string;
    ppe: string;
  }>;
}

export default function AiAdmin() {
  const [selectedFormulation, setSelectedFormulation] = useState<AiFormulation | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: formulations = [], isLoading, refetch } = useQuery<AiFormulation[]>({
    queryKey: ["/api/ai-formulations"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/ai-formulations/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Status Updated",
        description: "Formulation status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update status.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/ai-formulations/${id}`);
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Deleted",
        description: "Formulation has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete formulation.",
        variant: "destructive",
      });
    },
  });

  const filteredFormulations = formulations.filter((formulation) => {
    if (statusFilter === "all") return true;
    return formulation.status === statusFilter;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
  };

  const parseFormulationData = (jsonString: string): FormulationDetails | null => {
    try {
      return JSON.parse(jsonString);
    } catch {
      return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                AI Formulation Admin
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage and review AI-generated formulations
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Beaker className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Total Generated
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formulations.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Approved
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formulations.filter((f) => f.status === 'approved').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <X className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Rejected
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formulations.filter((f) => f.status === 'rejected').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Pending Review
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formulations.filter((f) => f.status === 'generated').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Controls */}
          <div className="flex gap-4 items-center">
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                data-testid="filter-all"
              >
                All ({formulations.length})
              </Button>
              <Button
                variant={statusFilter === "generated" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("generated")}
                data-testid="filter-pending"
              >
                Pending ({formulations.filter((f) => f.status === 'generated').length})
              </Button>
              <Button
                variant={statusFilter === "approved" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("approved")}
                data-testid="filter-approved"
              >
                Approved ({formulations.filter((f) => f.status === 'approved').length})
              </Button>
              <Button
                variant={statusFilter === "rejected" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("rejected")}
                data-testid="filter-rejected"
              >
                Rejected ({formulations.filter((f) => f.status === 'rejected').length})
              </Button>
            </div>
          </div>
        </div>

        {/* Formulations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Formulations</CardTitle>
            <CardDescription>
              Review and manage AI-generated chemical formulations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredFormulations.length === 0 ? (
              <div className="text-center py-8">
                <Beaker className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No formulations found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFormulations.map((formulation) => {
                      const formulationData = parseFormulationData(formulation.generatedFormulation || "{}");
                      return (
                        <TableRow key={formulation.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {formulation.name}
                              </div>
                              {formulationData && (
                                <div className="text-sm text-gray-500">
                                  {formulationData.ingredients.length} ingredients
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {formulation.productCategory}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeColor(formulation.status)}>
                              {formulation.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span className="capitalize text-sm">
                                {formulation.budgetCategory}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(formulation.createdAt.toString())}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {/* View Details */}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedFormulation(formulation)}
                                    data-testid={`view-formulation-${formulation.id}`}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[80vh]">
                                  <DialogHeader>
                                    <DialogTitle>{formulation.name}</DialogTitle>
                                    <DialogDescription>
                                      Detailed formulation information
                                    </DialogDescription>
                                  </DialogHeader>
                                  {formulationData && (
                                    <ScrollArea className="max-h-[60vh]">
                                      <Tabs defaultValue="overview" className="w-full">
                                        <TabsList className="grid w-full grid-cols-5">
                                          <TabsTrigger value="overview">Overview</TabsTrigger>
                                          <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
                                          <TabsTrigger value="process">Process</TabsTrigger>
                                          <TabsTrigger value="cost">Cost</TabsTrigger>
                                          <TabsTrigger value="safety">Safety</TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="overview" className="space-y-4">
                                          <div className="grid grid-cols-2 gap-4">
                                            <Card>
                                              <CardHeader className="pb-3">
                                                <CardTitle className="text-sm">Product Properties</CardTitle>
                                              </CardHeader>
                                              <CardContent className="space-y-2">
                                                <div className="flex justify-between">
                                                  <span className="text-sm text-gray-500">pH Level:</span>
                                                  <span className="text-sm font-medium">{formulationData.properties.phLevel}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-sm text-gray-500">Viscosity:</span>
                                                  <span className="text-sm font-medium">{formulationData.properties.viscosity}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-sm text-gray-500">Appearance:</span>
                                                  <span className="text-sm font-medium">{formulationData.properties.appearance}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-sm text-gray-500">Shelf Life:</span>
                                                  <span className="text-sm font-medium">{formulationData.properties.shelfLife}</span>
                                                </div>
                                              </CardContent>
                                            </Card>
                                            <Card>
                                              <CardHeader className="pb-3">
                                                <CardTitle className="text-sm">Formulation Info</CardTitle>
                                              </CardHeader>
                                              <CardContent className="space-y-2">
                                                <div className="flex justify-between">
                                                  <span className="text-sm text-gray-500">Category:</span>
                                                  <span className="text-sm font-medium capitalize">{formulation.productCategory}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-sm text-gray-500">Consistency:</span>
                                                  <span className="text-sm font-medium capitalize">{formulation.consistency}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-sm text-gray-500">Budget:</span>
                                                  <span className="text-sm font-medium capitalize">{formulation.budgetCategory}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-sm text-gray-500">Volume:</span>
                                                  <span className="text-sm font-medium capitalize">{formulation.productionVolume}</span>
                                                </div>
                                              </CardContent>
                                            </Card>
                                          </div>
                                          <div>
                                            <h4 className="font-semibold mb-2">Description</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                              {formulationData.description}
                                            </p>
                                          </div>
                                        </TabsContent>

                                        <TabsContent value="ingredients">
                                          <div className="space-y-4">
                                            {formulationData.ingredients.map((ingredient, index) => (
                                              <Card key={index}>
                                                <CardContent className="p-4">
                                                  <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                      <h4 className="font-medium">{ingredient.name}</h4>
                                                      <p className="text-sm text-gray-500">{ingredient.function}</p>
                                                      {ingredient.supplier && (
                                                        <p className="text-xs text-blue-600">Supplier: {ingredient.supplier}</p>
                                                      )}
                                                    </div>
                                                    <div className="text-right">
                                                      <div className="text-lg font-bold">{ingredient.percentage}%</div>
                                                      {ingredient.cost && (
                                                        <div className="text-sm text-gray-500">
                                                          {formatCurrency(ingredient.cost)}/kg
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                </CardContent>
                                              </Card>
                                            ))}
                                          </div>
                                        </TabsContent>

                                        <TabsContent value="process">
                                          <div className="space-y-3">
                                            {formulationData.manufacturingProcess.map((step) => (
                                              <Card key={step.step}>
                                                <CardContent className="p-4">
                                                  <div className="flex gap-4">
                                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                                      <span className="text-sm font-bold text-blue-600 dark:text-blue-300">
                                                        {step.step}
                                                      </span>
                                                    </div>
                                                    <div className="flex-1">
                                                      <p className="text-sm">{step.instruction}</p>
                                                      {(step.temperature || step.duration || step.equipment) && (
                                                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                                          {step.temperature && <span>🌡️ {step.temperature}</span>}
                                                          {step.duration && <span>⏱️ {step.duration}</span>}
                                                          {step.equipment && <span>🔧 {step.equipment}</span>}
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                </CardContent>
                                              </Card>
                                            ))}
                                          </div>
                                        </TabsContent>

                                        <TabsContent value="cost">
                                          <div className="space-y-4">
                                            <Card>
                                              <CardContent className="p-6">
                                                <div className="text-center">
                                                  <div className="text-3xl font-bold text-green-600">
                                                    {formatCurrency(formulationData.costAnalysis.totalCostPerKg)}
                                                  </div>
                                                  <div className="text-sm text-gray-500">per kilogram</div>
                                                  <div className="mt-2">
                                                    <Badge className="bg-blue-100 text-blue-800">
                                                      {formulationData.costAnalysis.budgetCategory}
                                                    </Badge>
                                                  </div>
                                                </div>
                                              </CardContent>
                                            </Card>
                                            {formulationData.costAnalysis.ingredientCosts && (
                                              <div>
                                                <h4 className="font-semibold mb-3">Ingredient Cost Breakdown</h4>
                                                <div className="space-y-2">
                                                  {formulationData.costAnalysis.ingredientCosts.map((cost, index) => (
                                                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                                      <span className="text-sm">{cost.ingredient}</span>
                                                      <div className="text-right">
                                                        <div className="text-sm font-medium">
                                                          {formatCurrency(cost.costPerKg)}/kg
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                          {cost.percentage}%
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </TabsContent>

                                        <TabsContent value="safety">
                                          {formulationData.safetyConsiderations && formulationData.safetyConsiderations.length > 0 ? (
                                            <div className="space-y-4">
                                              {formulationData.safetyConsiderations.map((safety, index) => (
                                                <Card key={index}>
                                                  <CardContent className="p-4">
                                                    <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">
                                                      ⚠️ {safety.hazard}
                                                    </h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                                      <strong>Precaution:</strong> {safety.precaution}
                                                    </p>
                                                    <p className="text-sm text-blue-600 dark:text-blue-400">
                                                      <strong>PPE Required:</strong> {safety.ppe}
                                                    </p>
                                                  </CardContent>
                                                </Card>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="text-center py-8">
                                              <p className="text-gray-500">No specific safety considerations listed</p>
                                            </div>
                                          )}
                                        </TabsContent>
                                      </Tabs>
                                    </ScrollArea>
                                  )}
                                </DialogContent>
                              </Dialog>

                              {/* Status Actions */}
                              {formulation.status === "generated" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      updateStatusMutation.mutate({
                                        id: formulation.id,
                                        status: "approved",
                                      })
                                    }
                                    disabled={updateStatusMutation.isPending}
                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                    data-testid={`approve-formulation-${formulation.id}`}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      updateStatusMutation.mutate({
                                        id: formulation.id,
                                        status: "rejected",
                                      })
                                    }
                                    disabled={updateStatusMutation.isPending}
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                    data-testid={`reject-formulation-${formulation.id}`}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}

                              {/* Delete Button */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteMutation.mutate(formulation.id)}
                                disabled={deleteMutation.isPending}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                data-testid={`delete-formulation-${formulation.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}