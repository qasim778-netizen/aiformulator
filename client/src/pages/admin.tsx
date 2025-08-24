import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Plus, Edit, Trash2, User, Ungroup, FlaskConical, CheckCircle, PauseCircle, Sparkles, Package, BarChart3, TrendingUp, Users, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import CategoryForm from "@/components/admin/category-form";
import FormulationForm from "@/components/admin/formulation-form";
import AiCategoryForm from "@/components/admin/ai-category-form";
import AiFormulationForm from "@/components/admin/ai-formulation-form";
import BulkGenerationForm from "@/components/admin/bulk-generation-form";
import BulkFormulationGenerator from "@/components/admin/bulk-formulation-generator";
import type { Category, Formulation } from "@shared/schema";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [analyticsFilter, setAnalyticsFilter] = useState<'browse' | 'generation'>('generation');
  const [currentPage, setCurrentPage] = useState(1);
  const [categoriesPage, setCategoriesPage] = useState(1);
  const [formulationsPage, setFormulationsPage] = useState(1);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [formulationDialogOpen, setFormulationDialogOpen] = useState(false);
  const [bulkGenerationDialogOpen, setBulkGenerationDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingFormulation, setEditingFormulation] = useState<Formulation | null>(null);
  const { toast } = useToast();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
  
  const { data: categoriesPaginated } = useQuery<{
    data: Category[];
    pagination: { currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number };
  }>({
    queryKey: ["/api/categories-paginated", categoriesPage],
    queryFn: async () => {
      const response = await fetch(`/api/categories?paginated=true&page=${categoriesPage}&limit=10`);
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    },
  });

  const { data: formulations = [] } = useQuery<Formulation[]>({
    queryKey: ["/api/formulations"],
  });
  
  const { data: formulationsPaginated } = useQuery<{
    data: Formulation[];
    pagination: { currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number };
  }>({
    queryKey: ["/api/formulations-paginated", formulationsPage, selectedCategory],
    queryFn: async () => {
      const categoryParam = selectedCategory !== 'all' ? `&categoryId=${selectedCategory}` : '';
      const response = await fetch(`/api/formulations?paginated=true&page=${formulationsPage}&limit=50${categoryParam}`);
      if (!response.ok) {
        throw new Error('Failed to fetch formulations');
      }
      return response.json();
    },
  });

  const { data: stats } = useQuery<{
    totalCategories: number;
    totalFormulations: number;
    activeFormulations: number;
    draftFormulations: number;
  }>({
    queryKey: ["/api/stats"],
  });

  const { data: aiAnalytics } = useQuery<{
    totalAiGenerations: number;
    dailyGenerations: number;
    weeklyGenerations: number;
    monthlyGenerations: number;
    popularCategories: Array<{ category: string; count: number }>;
    usageByCountry: Array<{ country: string; count: number }>;
    recentGenerations: Array<{
      id: string;
      productName: string;
      category: string;
      timestamp: string;
      sessionId: string;
      country?: string;
      city?: string;
    }>;
    generationsByHour: Array<{ hour: number; count: number }>;
    avgResponseTime: number;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }>({
    queryKey: ["/api/ai-analytics", analyticsFilter, currentPage],
    queryFn: async () => {
      const response = await fetch(`/api/ai-analytics?type=${analyticsFilter}&page=${currentPage}&limit=50`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      return response.json();
    },
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories-paginated"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Category deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete category", variant: "destructive" });
    },
  });

  const deleteFormulation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/formulations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/formulations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/formulations-paginated"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Formulation deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete formulation", variant: "destructive" });
    },
  });

  const filteredFormulations = selectedCategory === "all" 
    ? formulations 
    : formulations.filter(f => f.categoryId === selectedCategory);

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || "Unknown";
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryDialogOpen(true);
  };

  const handleEditFormulation = (formulation: Formulation) => {
    setEditingFormulation(formulation);
    setFormulationDialogOpen(true);
  };

  const handleCategoryDialogClose = () => {
    setCategoryDialogOpen(false);
    setEditingCategory(null);
  };

  const handleFormulationDialogClose = () => {
    setFormulationDialogOpen(false);
    setEditingFormulation(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" className="text-primary hover:text-blue-700 mr-6">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Website
                </Button>
              </Link>
              <h1 className="text-2xl font-inter font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, Administrator</span>
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="text-white text-sm h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("overview")}
              >
                Overview
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "categories"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("categories")}
              >
                Manage Categories
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "formulations"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("formulations")}
              >
                Manage Formulations
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "bulk-generation"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("bulk-generation")}
              >
                Bulk Generation
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "bulk-formulations"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("bulk-formulations")}
              >
                Bulk Formulations
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "ai-analytics"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("ai-analytics")}
              >
                AI Analytics
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Admin Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white rounded-lg shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                      <Ungroup className="text-white text-xl h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-inter font-semibold text-gray-900">
                        {stats?.totalCategories || 0}
                      </h3>
                      <p className="text-sm text-gray-600">Total Categories</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white rounded-lg shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-success rounded-lg flex items-center justify-center">
                      <FlaskConical className="text-white text-xl h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-inter font-semibold text-gray-900">
                        {stats?.totalFormulations || 0}
                      </h3>
                      <p className="text-sm text-gray-600">Total Formulations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white rounded-lg shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                      <CheckCircle className="text-white text-xl h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-inter font-semibold text-gray-900">
                        {stats?.activeFormulations || 0}
                      </h3>
                      <p className="text-sm text-gray-600">Active Formulations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white rounded-lg shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                      <PauseCircle className="text-white text-xl h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-inter font-semibold text-gray-900">
                        {stats?.draftFormulations || 0}
                      </h3>
                      <p className="text-sm text-gray-600">Draft Formulations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activities */}
            <Card className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-inter font-semibold text-gray-900">Recent Activities</h3>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-success rounded-full mr-4"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">System initialized with sample data</p>
                      <p className="text-xs text-gray-500">System startup</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-4"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">Categories and formulations loaded</p>
                      <p className="text-xs text-gray-500">Data initialization</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-accent rounded-full mr-4"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">Admin dashboard accessed</p>
                      <p className="text-xs text-gray-500">Current session</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Categories Management Tab */}
        {activeTab === "categories" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-inter font-semibold text-gray-900">Manage Categories</h2>
              <div className="flex gap-3">
                <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-primary text-primary hover:bg-blue-50">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Manually
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingCategory ? "Edit Category" : "Add New Category"}
                      </DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="manual" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                        <TabsTrigger value="ai">AI Generation</TabsTrigger>
                      </TabsList>
                      <TabsContent value="manual" className="mt-4">
                        <CategoryForm
                          category={editingCategory}
                          onSuccess={handleCategoryDialogClose}
                        />
                      </TabsContent>
                      <TabsContent value="ai" className="mt-4">
                        <AiCategoryForm onSuccess={handleCategoryDialogClose} />
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
                <Button className="bg-accent text-white hover:bg-orange-600" onClick={() => setCategoryDialogOpen(true)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate with AI
                </Button>
              </div>
            </div>

            <Card className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Formulations
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categoriesPaginated?.data?.map((category) => {
                      const formulationCount = formulations.filter(f => f.categoryId === category.id).length;
                      return (
                        <tr key={category.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img
                                  className="h-10 w-10 rounded-lg object-cover"
                                  src={category.image}
                                  alt={category.name}
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{category.name}</div>
                                <div className="text-sm text-gray-500">{category.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formulationCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={category.isActive ? "bg-success text-white" : "bg-gray-500 text-white"}>
                              {category.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(category.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:text-blue-700"
                              onClick={() => handleEditCategory(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-900"
                              onClick={() => deleteCategory.mutate(category.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    }) || (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No categories found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Categories Pagination */}
              {categoriesPaginated?.pagination && categoriesPaginated.pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {((categoriesPaginated.pagination.currentPage - 1) * categoriesPaginated.pagination.itemsPerPage) + 1} to {Math.min(categoriesPaginated.pagination.currentPage * categoriesPaginated.pagination.itemsPerPage, categoriesPaginated.pagination.totalItems)} of {categoriesPaginated.pagination.totalItems} categories
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCategoriesPage(prev => Math.max(prev - 1, 1))}
                      disabled={categoriesPaginated.pagination.currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    {Array.from({ length: Math.min(5, categoriesPaginated.pagination.totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(
                        categoriesPaginated.pagination.currentPage - 2 + i,
                        categoriesPaginated.pagination.totalPages - 4 + i
                      ));
                      if (pageNum <= categoriesPaginated.pagination.totalPages) {
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === categoriesPaginated.pagination.currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCategoriesPage(pageNum)}
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
                      onClick={() => setCategoriesPage(prev => Math.min(prev + 1, categoriesPaginated.pagination.totalPages))}
                      disabled={categoriesPaginated.pagination.currentPage === categoriesPaginated.pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Formulations Management Tab */}
        {activeTab === "formulations" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-inter font-semibold text-gray-900">Manage Formulations</h2>
              <div className="flex space-x-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={formulationDialogOpen} onOpenChange={setFormulationDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-primary text-primary hover:bg-blue-50">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Manually
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingFormulation ? "Edit Formulation" : "Add New Formulation"}
                      </DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="manual" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                        <TabsTrigger value="ai">AI Generation</TabsTrigger>
                      </TabsList>
                      <TabsContent value="manual" className="mt-4">
                        <FormulationForm
                          formulation={editingFormulation}
                          categories={categories}
                          onSuccess={handleFormulationDialogClose}
                        />
                      </TabsContent>
                      <TabsContent value="ai" className="mt-4">
                        <AiFormulationForm 
                          categories={categories}
                          onSuccess={handleFormulationDialogClose}
                        />
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
                <Button className="bg-accent text-white hover:bg-orange-600" onClick={() => setFormulationDialogOpen(true)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate with AI
                </Button>
              </div>
            </div>

            <Card className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Formulation Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ingredients
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formulationsPaginated?.data?.map((formulation) => {
                      const ingredients = JSON.parse(formulation.ingredients);
                      return (
                        <tr key={formulation.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{formulation.name}</div>
                              <div className="text-sm text-gray-500">{formulation.description.substring(0, 60)}...</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              {getCategoryName(formulation.categoryId)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {ingredients.length} components
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={formulation.isActive ? "bg-success text-white" : "bg-yellow-500 text-white"}>
                              {formulation.isActive ? "Active" : "Draft"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(formulation.updatedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:text-blue-700"
                              onClick={() => handleEditFormulation(formulation)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Link href={`/formulation/${formulation.id}`}>
                              <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-900">
                                View
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-900"
                              onClick={() => deleteFormulation.mutate(formulation.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    }) || (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No formulations found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Formulations Pagination */}
              {formulationsPaginated?.pagination && formulationsPaginated.pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {((formulationsPaginated.pagination.currentPage - 1) * formulationsPaginated.pagination.itemsPerPage) + 1} to {Math.min(formulationsPaginated.pagination.currentPage * formulationsPaginated.pagination.itemsPerPage, formulationsPaginated.pagination.totalItems)} of {formulationsPaginated.pagination.totalItems} formulations
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFormulationsPage(prev => Math.max(prev - 1, 1))}
                      disabled={formulationsPaginated.pagination.currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    {Array.from({ length: Math.min(5, formulationsPaginated.pagination.totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(
                        formulationsPaginated.pagination.currentPage - 2 + i,
                        formulationsPaginated.pagination.totalPages - 4 + i
                      ));
                      if (pageNum <= formulationsPaginated.pagination.totalPages) {
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === formulationsPaginated.pagination.currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFormulationsPage(pageNum)}
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
                      onClick={() => setFormulationsPage(prev => Math.min(prev + 1, formulationsPaginated.pagination.totalPages))}
                      disabled={formulationsPaginated.pagination.currentPage === formulationsPaginated.pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Bulk Generation Tab */}
        {activeTab === "bulk-generation" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-inter font-semibold text-gray-900">Bulk Category Generation</h2>
                <p className="text-sm text-gray-600 mt-1">Create multiple new categories at once that don't already exist</p>
              </div>
              <Dialog open={bulkGenerationDialogOpen} onOpenChange={setBulkGenerationDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 text-white hover:bg-blue-700">
                    <Package className="h-4 w-4 mr-2" />
                    Generate Categories
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Bulk Category Generator</DialogTitle>
                  </DialogHeader>
                  <BulkGenerationForm onSuccess={() => setBulkGenerationDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-6">
              {/* Quick Actions */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-inter font-semibold text-blue-900 mb-2">
                        Automated Category Creation
                      </h3>
                      <p className="text-blue-700 mb-4">
                        Generate multiple unique categories at once. AI will automatically avoid creating duplicates 
                        and provide professional details for each category.
                      </p>
                      <div className="flex gap-4 text-sm text-blue-600">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          AI-powered category creation
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          Avoids duplicate categories
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          Professional descriptions & images
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setBulkGenerationDialogOpen(true)}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                      data-testid="button-bulk-generation-card"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Generate Categories
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Generation Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Package className="text-white h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-inter font-semibold text-gray-900">
                          {stats?.totalCategories || 0}
                        </h3>
                        <p className="text-sm text-gray-600">Total Categories</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                        <FlaskConical className="text-white h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-inter font-semibold text-gray-900">
                          {stats?.totalFormulations || 0}
                        </h3>
                        <p className="text-sm text-gray-600">Total Formulations</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                        <Sparkles className="text-white h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-inter font-semibold text-gray-900">
                          AI-Powered
                        </h3>
                        <p className="text-sm text-gray-600">Generation System</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Categories Preview */}
              <Card>
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-inter font-semibold text-gray-900">Recent Categories</h3>
                  <p className="text-sm text-gray-600">Latest categories in your system</p>
                </div>
                <CardContent className="p-6">
                  {categories.length > 0 ? (
                    <div className="grid gap-4">
                      {categories.slice(0, 3).map((category) => {
                        const formulationCount = formulations.filter(f => f.categoryId === category.id).length;
                        return (
                          <div key={category.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <img
                                className="h-12 w-12 rounded-lg object-cover"
                                src={category.image}
                                alt={category.name}
                              />
                              <div className="ml-4">
                                <h4 className="text-sm font-medium text-gray-900">{category.name}</h4>
                                <p className="text-xs text-gray-500">{formulationCount} formulations</p>
                              </div>
                            </div>
                            <Badge className="bg-green-100 text-green-800">
                              Active
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No categories yet. Start by creating your first category with bulk generation!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Bulk Formulations Tab */}
        {activeTab === "bulk-formulations" && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-inter font-semibold text-gray-900">Bulk Formulations Generator</h2>
              <p className="text-sm text-gray-600 mt-1">Select an existing category and generate multiple formulations automatically</p>
            </div>
            <BulkFormulationGenerator categories={categories} />
          </div>
        )}

        {/* AI Analytics Tab */}
        {activeTab === "ai-analytics" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-inter font-semibold text-gray-900">AI Analytics & Usage Statistics</h2>
                <p className="text-sm text-gray-600 mt-1">Monitor AI formulator usage, user activity, and generation trends</p>
              </div>
            </div>

            {/* Analytics Filter */}
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-inter font-semibold text-gray-900 mb-4">Analytics Filter</h3>
                <div className="flex space-x-4">
                  <Button
                    onClick={() => {
                      setAnalyticsFilter('browse');
                      setCurrentPage(1);
                    }}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      analyticsFilter === 'browse'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Analytics Browse Formulation
                  </Button>
                  <Button
                    onClick={() => {
                      setAnalyticsFilter('generation');
                      setCurrentPage(1);
                    }}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      analyticsFilter === 'generation'
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Formulation Generation
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  {analyticsFilter === 'browse' 
                    ? 'View analytics for users browsing and viewing existing formulations'
                    : 'View analytics for users creating custom formulations with AI'
                  }
                </p>
              </div>
            </div>

            {/* Analytics Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white rounded-lg shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                      <BarChart3 className="text-white text-xl h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-inter font-semibold text-gray-900">
                        {aiAnalytics?.totalAiGenerations || 0}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {analyticsFilter === 'browse' ? 'Total Browse Views' : 'Total AI Generations'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white rounded-lg shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                      <TrendingUp className="text-white text-xl h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-inter font-semibold text-gray-900">
                        {aiAnalytics?.dailyGenerations || 0}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {analyticsFilter === 'browse' ? 'Today\'s Views' : 'Today\'s Generations'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white rounded-lg shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                      <Users className="text-white text-xl h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-inter font-semibold text-gray-900">
                        {aiAnalytics?.weeklyGenerations || 0}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {analyticsFilter === 'browse' ? 'This Week Views' : 'This Week'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white rounded-lg shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                      <Sparkles className="text-white text-xl h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-inter font-semibold text-gray-900">
                        {analyticsFilter === 'browse' 
                          ? `${Math.round(((aiAnalytics?.totalAiGenerations || 0) / Math.max(aiAnalytics?.weeklyGenerations || 1, 1)) * 10) / 10}`
                          : `${aiAnalytics?.avgResponseTime || 0}s`
                        }
                      </h3>
                      <p className="text-sm text-gray-600">
                        {analyticsFilter === 'browse' ? 'Avg Views/User' : 'Avg Response Time'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analytics Charts and Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Popular Categories */}
              <Card className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-inter font-semibold text-gray-900">Popular Categories</h3>
                  <p className="text-sm text-gray-600">
                    {analyticsFilter === 'browse' ? 'Most viewed product categories' : 'Most requested product categories'}
                  </p>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {aiAnalytics?.popularCategories?.map((cat, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                            <span className="text-white text-xs font-bold">{index + 1}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{cat.category}</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${(cat.count / (aiAnalytics?.popularCategories?.[0]?.count || 1)) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{cat.count}</span>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center text-gray-500 py-8">
                        <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No data available yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Usage by Country */}
              <Card className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-inter font-semibold text-gray-900">Usage by Country</h3>
                  <p className="text-sm text-gray-600">
                    {analyticsFilter === 'browse' ? 'Geographic distribution of formulation views' : 'Geographic distribution of AI generations'}
                  </p>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {aiAnalytics?.usageByCountry?.map((country, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-white text-xs font-bold">{index + 1}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{country.country}</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                            <div 
                              className="bg-emerald-500 h-2 rounded-full" 
                              style={{ width: `${(country.count / (aiAnalytics?.usageByCountry?.[0]?.count || 1)) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{country.count}</span>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center text-gray-500 py-8">
                        <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No geographic data available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Usage by Hour */}
              <Card className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-inter font-semibold text-gray-900">Usage by Hour</h3>
                  <p className="text-sm text-gray-600">
                    {analyticsFilter === 'browse' ? 'Formulation views throughout the day' : 'AI generations throughout the day'}
                  </p>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {aiAnalytics?.generationsByHour?.map((hour) => (
                      <div key={hour.hour} className="flex items-center">
                        <span className="text-sm text-gray-600 w-16">{hour.hour}:00</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${(hour.count / Math.max(...(aiAnalytics?.generationsByHour?.map(h => h.count) || [1]))) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{hour.count}</span>
                      </div>
                    )) || (
                      <div className="text-center text-gray-500 py-8">
                        <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No hourly data available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent AI Generations */}
            <Card className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-inter font-semibold text-gray-900">
                  {analyticsFilter === 'browse' ? 'Recent Formulation Views' : 'Recent AI Generations'}
                </h3>
                <p className="text-sm text-gray-600">
                  {analyticsFilter === 'browse' 
                    ? 'Latest formulations viewed by users' 
                    : 'Latest custom formulations created by users'
                  }
                </p>
              </div>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Session ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Generated At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {aiAnalytics?.recentGenerations?.map((generation) => (
                        <tr key={generation.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                                <Sparkles className="text-white h-4 w-4" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {generation.productName || 'Untitled Product'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className="bg-blue-100 text-blue-800">
                              {generation.category}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Globe className="h-4 w-4 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {generation.country || 'Unknown'}
                                </div>
                                {generation.city && (
                                  <div className="text-xs text-gray-500">
                                    {generation.city}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {generation.sessionId.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(generation.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className="bg-green-100 text-green-800">
                              Generated
                            </Badge>
                          </td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No AI generations yet</p>
                            <p className="text-sm">Data will appear here as users create custom formulations</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {aiAnalytics?.pagination && aiAnalytics.pagination.totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {((aiAnalytics.pagination.currentPage - 1) * aiAnalytics.pagination.itemsPerPage) + 1} to {Math.min(aiAnalytics.pagination.currentPage * aiAnalytics.pagination.itemsPerPage, aiAnalytics.pagination.totalItems)} of {aiAnalytics.pagination.totalItems} entries
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={aiAnalytics.pagination.currentPage === 1}
                      >
                        Previous
                      </Button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, aiAnalytics.pagination.totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(
                          aiAnalytics.pagination.currentPage - 2 + i,
                          aiAnalytics.pagination.totalPages - 4 + i
                        ));
                        if (pageNum <= aiAnalytics.pagination.totalPages) {
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === aiAnalytics.pagination.currentPage ? "default" : "outline"}
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
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, aiAnalytics.pagination.totalPages))}
                        disabled={aiAnalytics.pagination.currentPage === aiAnalytics.pagination.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
