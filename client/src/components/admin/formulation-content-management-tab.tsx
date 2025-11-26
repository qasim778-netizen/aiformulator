import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormulationContentForm from "@/components/admin/formulation-content-form";
import PageContentGenerator from "@/components/admin/page-content-generator";
import type { Formulation, Category } from "@shared/schema";

export default function FormulationContentManagementTab() {
  const [selectedFormulationId, setSelectedFormulationId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: formulations = [] } = useQuery<Formulation[]>({
    queryKey: ["/api/formulations"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Filter formulations based on search and category
  const filteredFormulations = useMemo(() => {
    return formulations.filter((formulation) => {
      const matchesSearch = formulation.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || formulation.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [formulations, searchQuery, selectedCategory]);

  const selectedFormulation = formulations.find(f => f.id === selectedFormulationId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage Formulation Page Content</CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Create custom page content for each formulation that will display on public pages instead of auto-generated technical data.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search formulations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-8"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category..." />
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
            </div>

            {/* Formulation Selector */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Select Formulation {filteredFormulations.length > 0 && `(${filteredFormulations.length} found)`}
              </label>
              <Select value={selectedFormulationId} onValueChange={setSelectedFormulationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a formulation to customize..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredFormulations.length > 0 ? (
                    filteredFormulations.map((formulation) => (
                      <SelectItem key={formulation.id} value={formulation.id}>
                        {formulation.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-gray-500">No formulations found</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedFormulation && (
              <Tabs defaultValue="auto-generate" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="auto-generate">Auto-Generate Full Page</TabsTrigger>
                  <TabsTrigger value="manual-edit">Manual Edit Sections</TabsTrigger>
                </TabsList>
                
                <TabsContent value="auto-generate">
                  <PageContentGenerator
                    formulationId={selectedFormulation.id}
                    formulationName={selectedFormulation.name}
                    category={selectedFormulation.categoryId || ""}
                    initialContent={(selectedFormulation as any)?.customPageContent || ""}
                  />
                </TabsContent>
                
                <TabsContent value="manual-edit">
                  <FormulationContentForm
                    formulationId={selectedFormulation.id}
                    formulationName={selectedFormulation.name}
                    onSuccess={() => {
                      setSelectedFormulationId("");
                    }}
                  />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
