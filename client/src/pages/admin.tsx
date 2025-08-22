import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Plus, Edit, Trash2, User, Ungroup, FlaskConical, CheckCircle, PauseCircle, Sparkles } from "lucide-react";
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
import type { Category, Formulation } from "@shared/schema";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [formulationDialogOpen, setFormulationDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingFormulation, setEditingFormulation] = useState<Formulation | null>(null);
  const { toast } = useToast();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: formulations = [] } = useQuery<Formulation[]>({
    queryKey: ["/api/formulations"],
  });

  const { data: stats } = useQuery<{
    totalCategories: number;
    totalFormulations: number;
    activeFormulations: number;
    draftFormulations: number;
  }>({
    queryKey: ["/api/stats"],
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
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
                    {categories.map((category) => {
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
                    })}
                  </tbody>
                </table>
              </div>
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
                    {filteredFormulations.map((formulation) => {
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
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
