import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Plus, Edit, Trash2, User, Ungroup, FlaskConical, CheckCircle, PauseCircle, Package, LogOut, Image, Eye, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { HelpButton } from "@/components/ui/help-button";
import { useGuidance } from "@/hooks/use-guidance";
import { queryClient, apiRequest } from "@/lib/queryClient";
import CategoryForm from "@/components/admin/category-form";
import FormulationForm from "@/components/admin/formulation-form";
import BulkGenerationForm from "@/components/admin/bulk-generation-form";
import BulkFormulationGenerator from "@/components/admin/bulk-formulation-generator";
import FormulaKeywordGenerator from "@/components/admin/formula-keyword-generator";
import LogoSettings from "@/components/admin/logo-settings";
import ContentManagementTab from "@/components/admin/content-management-tab";
import AICategorySuggestions from "@/components/admin/ai-category-suggestions";
import FormulationTester from "@/components/admin/formulation-tester";
import FormulationContentManagementTab from "@/components/admin/formulation-content-management-tab";
import GeneratedFormulasTab from "@/components/admin/generated-formulas-tab";
import type { Category, Formulation } from "@shared/schema";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  // Reset page to 1 when category changes
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setFormulationsPage(1);
  };
  const [currentPage, setCurrentPage] = useState(1);
  const [categoriesPage, setCategoriesPage] = useState(1);
  const [formulationsPage, setFormulationsPage] = useState(1);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [formulationDialogOpen, setFormulationDialogOpen] = useState(false);
  const [bulkGenerationDialogOpen, setBulkGenerationDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingFormulation, setEditingFormulation] = useState<Formulation | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { toast } = useToast();
  const { startGuidance, isCompleted } = useGuidance();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Redirect to login if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You need to log in to access the admin dashboard. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);
      return;
    }
    
    if (!isLoading && isAuthenticated && user && !user.isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  // Auto-start guidance for first-time users
  useEffect(() => {
    if (!isCompleted("admin-overview")) {
      const timer = setTimeout(() => {
        startGuidance("admin-overview");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [startGuidance, isCompleted]);

  // Fetch categories from database
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Paginate the database categories locally
  const itemsPerPage = 10;
  const totalPages = Math.ceil((categories?.length || 0) / itemsPerPage);
  const startIndex = (categoriesPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  const categoriesPaginated = {
    data: categories?.slice(startIndex, endIndex) || [],
    pagination: {
      currentPage: categoriesPage,
      totalPages: totalPages,
      totalItems: categories?.length || 0,
      itemsPerPage: itemsPerPage
    }
  };

  const { data: formulationsPaginated } = useQuery<{
    data: Formulation[];
    pagination: { currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number };
  }>({
    queryKey: ["/api/admin/formulations", formulationsPage, selectedCategory],
    queryFn: async () => {
      const categoryParam = selectedCategory !== "all" ? `&categoryId=${selectedCategory}` : "";
      const response = await fetch(`/api/admin/formulations?page=${formulationsPage}&limit=10${categoryParam}`);
      if (!response.ok) {
        throw new Error('Failed to fetch formulations');
      }
      return response.json();
    },
  });

  const { data: formulationsData } = useQuery<Formulation[]>({
    queryKey: ["/api/formulations"],
  });

  // Calculate stats based on database categories
  const stats = {
    totalCategories: categories?.length || 0,
    totalFormulations: formulationsData?.length || 0,
    activeFormulations: formulationsData?.filter(f => f.isActive !== false).length || 0,
    draftFormulations: formulationsData?.filter(f => f.isActive === false).length || 0,
  };

  // Check if category has formulations
  const checkCategoryFormulations = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/formulations?categoryId=${categoryId}&limit=1`);
      if (!response.ok) throw new Error('Failed to check formulations');
      const data = await response.json();
      return data.length > 0;
    } catch {
      return false;
    }
  };

  const deleteCategory = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setDeleteConfirmOpen(false);
      setDeletingCategory(null);
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    },
    onError: (error: any) => {
      setDeleteConfirmOpen(false);
      setDeletingCategory(null);
      toast({ 
        title: "Delete failed", 
        description: error?.message || "Failed to delete category",
        variant: "destructive" 
      });
    },
  });

  const handleDeleteCategory = async (category: Category) => {
    const hasFormulations = await checkCategoryFormulations(category.id);
    
    if (hasFormulations) {
      toast({
        title: "Cannot Delete Category",
        description: "This category contains formulations. Please remove or move all formulations before deleting the category.",
        variant: "destructive"
      });
      return;
    }
    
    setDeletingCategory(category);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteCategory = () => {
    if (deletingCategory) {
      deleteCategory.mutate(deletingCategory.id);
    }
  };

  const deleteFormulation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/formulations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/formulations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/formulations-paginated"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/formulations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/formulations-all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Formulation deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete formulation", variant: "destructive" });
    },
  });

  const updateFormulationStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      apiRequest("PATCH", `/api/admin/formulations/${id}/status`, { isActive }),
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/formulations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/formulations-all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ 
        title: isActive ? "Formulation Approved" : "Formulation Deactivated", 
        description: isActive 
          ? "The formulation is now live and visible to users"
          : "The formulation has been deactivated"
      });
    },
    onError: () => {
      toast({ 
        title: "Failed to update formulation status", 
        variant: "destructive" 
      });
    },
  });

  const getCategoryName = (categoryId: string): string => {
    // Find category by ID (database categories now use direct ID matching)
    const category = categories?.find(cat => cat.id === categoryId);
    return category?.name || "Unknown Category";
  };

  // Handle logout
  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null; // Will be redirected by useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" className="text-primary hover:text-blue-700 mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Site
                </Button>
              </Link>
              <h1 className="text-xl font-inter font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <User className="h-4 w-4 mr-2" />
                {user?.email || 'Admin User'}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Quick Actions
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => { setActiveTab("formulations"); setFormulationDialogOpen(true); }} data-testid="dropdown-create-formulation">
                    <FlaskConical className="h-4 w-4 mr-2" />
                    <span>1. Create Formulation</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setActiveTab("bulk-formulations"); setBulkGenerationDialogOpen(true); }} data-testid="dropdown-create-bulk">
                    <Ungroup className="h-4 w-4 mr-2" />
                    <span>2. Bulk Formulation</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin/products" data-testid="dropdown-sample-products">
                      <Package className="h-4 w-4 mr-2" />
                      <span>Add Sample Product</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" onClick={handleLogout} className="text-gray-600 hover:text-gray-800" data-testid="button-logout">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${ 
                activeTab === "overview" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("overview")}
              data-testid="admin-overview-tab"
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
              data-testid="admin-categories-tab"
            >
              Categories
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "formulations"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("formulations")}
              data-testid="admin-formulations-tab"
            >
              Formulations
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "bulk-formulations"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("bulk-formulations")}
              data-testid="admin-bulk-formulations-tab"
            >
              Bulk Formulations
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "settings"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("settings")}
              data-testid="admin-settings-tab"
            >
              Settings
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "content"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("content")}
              data-testid="admin-content-tab"
            >
              Content
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "formulation-content"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("formulation-content")}
              data-testid="admin-formulation-content-tab"
            >
              Page Content
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "test-formulation"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("test-formulation")}
              data-testid="admin-test-formulation-tab"
            >
              🧪 Test AI System
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "generated-formulas"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("generated-formulas")}
              data-testid="admin-generated-formulas-tab"
            >
              Generated Formulas
            </button>
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white rounded-lg shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                      <Ungroup className="text-white text-xl h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-inter font-semibold text-gray-900">{stats?.totalCategories || 0}</h3>
                      <p className="text-sm text-gray-600">Total Categories</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white rounded-lg shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                      <FlaskConical className="text-white text-xl h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-inter font-semibold text-gray-900">{stats?.totalFormulations || 0}</h3>
                      <p className="text-sm text-gray-600">Total Formulations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white rounded-lg shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                      <CheckCircle className="text-white text-xl h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-inter font-semibold text-gray-900">{stats?.activeFormulations || 0}</h3>
                      <p className="text-sm text-gray-600">Active Formulations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white rounded-lg shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <PauseCircle className="text-white text-xl h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-inter font-semibold text-gray-900">{stats?.draftFormulations || 0}</h3>
                      <p className="text-sm text-gray-600">Draft Formulations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Quick Actions */}
              <Card className="bg-white rounded-lg shadow-md">
                <CardContent className="p-6">
                  <h3 className="text-lg font-inter font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full justify-start" data-testid="button-add-category">
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Category
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Create New Category</DialogTitle>
                          <DialogDescription>
                            Add a new category to organize your formulations
                          </DialogDescription>
                        </DialogHeader>
                        <div className="p-6 text-center">
                          <p className="text-gray-600 mb-4">Formulation categories are system-defined and cannot be added.</p>
                          <p className="text-sm text-gray-500">The 22 formulation categories provide comprehensive coverage for all chemical formulation types.</p>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={formulationDialogOpen} onOpenChange={setFormulationDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start" data-testid="button-add-formulation">
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Formulation
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Create New Formulation</DialogTitle>
                          <DialogDescription>
                            Add a new formulation with ingredients and instructions
                          </DialogDescription>
                        </DialogHeader>
                        <FormulationForm 
                          categories={categories || []} 
                          onSuccess={() => setFormulationDialogOpen(false)} 
                        />
                      </DialogContent>
                    </Dialog>

                    <Dialog open={bulkGenerationDialogOpen} onOpenChange={setBulkGenerationDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="secondary" className="w-full justify-start" data-testid="button-bulk-generation">
                          <Package className="h-4 w-4 mr-2" />
                          Bulk Category Generation
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>AI Bulk Category Generation</DialogTitle>
                          <DialogDescription>
                            Generate multiple categories at once using AI
                          </DialogDescription>
                        </DialogHeader>
                        <BulkGenerationForm onSuccess={() => setBulkGenerationDialogOpen(false)} />
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-white rounded-lg shadow-md">
                <CardContent className="p-6">
                  <h3 className="text-lg font-inter font-semibold text-gray-900 mb-4">Recent Categories</h3>
                  {categories && categories.length > 0 ? (
                    <div className="space-y-2">
                      {categories.slice(0, 5).map((category) => (
                        <div key={category.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <span className="text-sm text-gray-700">{category.name}</span>
                          <Badge variant="outline">Active</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No categories yet. Start by creating your first category!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deletingCategory?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  // TODO: Implement category deletion
                  toast({
                    title: "Category Deleted",
                    description: `${deletingCategory?.name} has been deleted successfully.`,
                  });
                  setDeleteConfirmOpen(false);
                  setDeletingCategory(null);
                }}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-inter font-semibold text-gray-900">Categories Management</h2>
                <p className="text-sm text-gray-600 mt-1">Manage product categories and their properties</p>
              </div>
              <div className="flex gap-2">
                <AICategorySuggestions />
                <Dialog open={categoryDialogOpen} onOpenChange={(open) => {
                  setCategoryDialogOpen(open);
                  if (!open) setEditingCategory(null);
                }}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-category-main">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingCategory ? "Edit Category" : "Create New Category"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingCategory ? "Update the category details and upload images" : "Add a new category to organize your formulations"}
                      </DialogDescription>
                    </DialogHeader>
                    <CategoryForm 
                      category={editingCategory}
                      onSuccess={() => {
                        setCategoryDialogOpen(false);
                        setEditingCategory(null);
                      }} 
                    />
                  </DialogContent>
              </Dialog>
              </div>
            </div>

            <Card className="bg-white rounded-lg shadow-md">
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {categoriesPaginated?.data?.map((category) => (
                        <tr key={category.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                                  <span className="text-white font-medium text-sm">
                                    {category.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{category.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{category.description}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingCategory(category);
                                  setCategoryDialogOpen(true);
                                }}
                                title="Edit category"
                                data-testid={`button-edit-category-${category.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setDeletingCategory(category);
                                  setDeleteConfirmOpen(true);
                                }}
                                title="Delete category"
                                className="text-red-600 hover:text-red-800"
                                data-testid={`button-delete-category-${category.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Upload category image"
                                data-testid={`button-upload-image-${category.id}`}
                              >
                                <Image className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {categoriesPaginated?.pagination && categoriesPaginated.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-600">
                      Showing {((categoriesPaginated.pagination.currentPage - 1) * categoriesPaginated.pagination.itemsPerPage) + 1} to{' '}
                      {Math.min(categoriesPaginated.pagination.currentPage * categoriesPaginated.pagination.itemsPerPage, categoriesPaginated.pagination.totalItems)} of{' '}
                      {categoriesPaginated.pagination.totalItems} results
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
                      
                      {Array.from({ length: categoriesPaginated.pagination.totalPages }, (_, i) => i + 1).map(pageNum => {
                        if (
                          pageNum === 1 ||
                          pageNum === categoriesPaginated.pagination.totalPages ||
                          (pageNum >= categoriesPaginated.pagination.currentPage - 1 && pageNum <= categoriesPaginated.pagination.currentPage + 1)
                        ) {
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
              </CardContent>
            </Card>
          </div>
        )}

        {/* Formulations Tab */}
        {activeTab === "formulations" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-inter font-semibold text-gray-900">Formulations Management</h2>
                <p className="text-sm text-gray-600 mt-1">Manage chemical formulations, approve drafts, and organize content</p>
              </div>
              <div className="flex space-x-4 items-center">
                <div className="flex items-center space-x-2">
                  <label htmlFor="category-filter" className="text-sm font-medium text-gray-700">Filter by category:</label>
                  <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                    <SelectTrigger className="w-48" id="category-filter">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Dialog open={formulationDialogOpen} onOpenChange={setFormulationDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-formulation-main">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Formulation
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingFormulation ? "Edit Formulation" : "Create New Formulation"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingFormulation ? "Update the formulation details" : "Add a new formulation with ingredients and instructions"}
                      </DialogDescription>
                    </DialogHeader>
                    <FormulationForm 
                      formulation={editingFormulation}
                      categories={categories || []} 
                      onSuccess={() => {
                        setFormulationDialogOpen(false);
                        setEditingFormulation(null);
                      }} 
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Card className="bg-white rounded-lg shadow-md">
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Image
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Formulation
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
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
                              <div className="h-16 w-16 flex-shrink-0">
                                {formulation.image ? (
                                  <img
                                    src={formulation.image}
                                    alt={formulation.imageAlt || `${formulation.name} formulation`}
                                    className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                                  />
                                ) : (
                                  <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                                    <Image className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{formulation.name}</div>
                                <div className="text-sm text-gray-500">{formulation.description.substring(0, 60)}...</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                {formulation.categoryId ? getCategoryName(formulation.categoryId) : 'Custom'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <Badge className={formulation.isActive ? "bg-success text-white" : "bg-yellow-500 text-white"}>
                                  {formulation.isActive ? "Active" : "Draft"}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateFormulationStatus.mutate({ 
                                    id: formulation.id, 
                                    isActive: !formulation.isActive 
                                  })}
                                  className={formulation.isActive ? "text-yellow-600 hover:text-yellow-800" : "text-green-600 hover:text-green-800"}
                                  title={formulation.isActive ? "Deactivate" : "Approve"}
                                  data-testid={`button-toggle-status-${formulation.id}`}
                                >
                                  {formulation.isActive ? <PauseCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                </Button>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <Link href={`/formulation/${formulation.id}`}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-600 hover:text-blue-900"
                                    title="View formulation"
                                    data-testid={`button-view-formulation-${formulation.id}`}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingFormulation(formulation);
                                    setFormulationDialogOpen(true);
                                  }}
                                  data-testid={`button-edit-formulation-${formulation.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteFormulation.mutate(formulation.id)}
                                  className="text-red-600 hover:text-red-900"
                                  data-testid={`button-delete-formulation-${formulation.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {formulationsPaginated?.pagination && formulationsPaginated.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-600">
                      Showing {((formulationsPaginated.pagination.currentPage - 1) * formulationsPaginated.pagination.itemsPerPage) + 1} to{' '}
                      {Math.min(formulationsPaginated.pagination.currentPage * formulationsPaginated.pagination.itemsPerPage, formulationsPaginated.pagination.totalItems)} of{' '}
                      {formulationsPaginated.pagination.totalItems} results
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
                      
                      {Array.from({ length: formulationsPaginated.pagination.totalPages }, (_, i) => i + 1).map(pageNum => {
                        if (
                          pageNum === 1 ||
                          pageNum === formulationsPaginated.pagination.totalPages ||
                          (pageNum >= formulationsPaginated.pagination.currentPage - 1 && pageNum <= formulationsPaginated.pagination.currentPage + 1)
                        ) {
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
              </CardContent>
            </Card>
          </div>
        )}


        {/* Bulk Formulations Tab */}
        {activeTab === "bulk-formulations" && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-inter font-semibold text-gray-900">Bulk Formulations Generator</h2>
              <p className="text-sm text-gray-600 mt-1">Select an existing category and generate multiple formulations automatically</p>
            </div>
            <BulkFormulationGenerator categories={categories || []} />
          </div>
        )}

        
        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-inter font-semibold text-gray-900">Application Settings</h2>
              <p className="text-sm text-gray-600 mt-1">Customize the appearance and branding of your application</p>
            </div>
            <LogoSettings />
          </div>
        )}
        
        {/* Content Management Tab */}
        {activeTab === "content" && (
          <ContentManagementTab />
        )}
        

        {/* Formulation Content Management Tab */}
        {activeTab === "formulation-content" && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-inter font-semibold text-gray-900">Formulation Page Content</h2>
              <p className="text-sm text-gray-600 mt-1">Customize content displayed on public formulation pages. Auto-generated content will be hidden.</p>
            </div>
            <FormulationContentManagementTab />
          </div>
        )}
        
        {/* Test Formulation System Tab */}
        {activeTab === "test-formulation" && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-inter font-semibold text-gray-900">AI Formulation System Tester</h2>
              <p className="text-sm text-gray-600 mt-1">Test the improved category-specific AI formulation generation with validation</p>
            </div>
            <FormulationTester />
          </div>
        )}

        {/* Generated Formulas Tab */}
        {activeTab === "generated-formulas" && (
          <GeneratedFormulasTab />
        )}
      </div>

      {/* Delete Category Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the category "{deletingCategory?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteConfirmOpen(false);
                setDeletingCategory(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteCategory}
              disabled={deleteCategory.isPending}
              data-testid="button-confirm-delete-category"
            >
              {deleteCategory.isPending ? "Deleting..." : "Delete Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}