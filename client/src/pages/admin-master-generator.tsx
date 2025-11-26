import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Copy, Download, Save, Loader2, CheckCircle2, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

export default function MasterGeneratorPage() {
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("Custom Innovations");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const { toast } = useToast();

  const { data: savedFormulations = [], isLoading: loadingSaved } = useQuery({
    queryKey: ["/api/admin/generated-formulations"],
  });

  const generateMutation = useMutation({
    mutationFn: async (data: { productName: string; category: string }) => {
      setIsGenerating(true);
      const response = await apiRequest("POST", "/api/admin/generate-formulation", data);
      return response;
    },
    onSuccess: (response) => {
      setGeneratedContent(response.content);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/generated-formulations"] });
      toast({
        title: "Success",
        description: "Formulation generated successfully!",
      });
      setIsGenerating(false);
    },
    onError: (error: any) => {
      setIsGenerating(false);
      toast({
        title: "Generation Failed",
        description: error?.message || "Failed to generate formulation",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!productName.trim()) {
      toast({ title: "Error", description: "Please enter a product name", variant: "destructive" });
      return;
    }
    generateMutation.mutate({ productName: productName.trim(), category });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    toast({ title: "Copied", description: "Content copied to clipboard" });
  };

  const handleSave = async () => {
    if (!generatedContent.trim()) {
      toast({ title: "Error", description: "No content to save", variant: "destructive" });
      return;
    }
    try {
      await apiRequest("POST", "/api/admin/save-generated-formulation", {
        productName: productName.trim(),
        category,
        content: generatedContent,
      });
      toast({ title: "Success", description: "Formulation saved to database" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/generated-formulations"] });
      setGeneratedContent("");
      setProductName("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to save formulation",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedContent], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${productName || "formulation"}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDeleteFormulation = async (id: string) => {
    try {
      await apiRequest("DELETE", `/api/admin/generated-formulations/${id}`);
      toast({ title: "Success", description: "Formulation deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/generated-formulations"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: "#1A1A1A" }}>Master Formulation Generator</h1>
        <p className="text-gray-600 mt-2">Generate professional formulations with AI</p>
      </div>

      {/* Input Card */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Generate New Formulation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Product Name</label>
            <Input
              placeholder="Enter product name..."
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              disabled={isGenerating}
              data-testid="input-product-name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={category} onValueChange={setCategory} disabled={isGenerating}>
              <SelectTrigger data-testid="select-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Custom Innovations">Custom Innovations</SelectItem>
                <SelectItem value="Car Care">Car Care</SelectItem>
                <SelectItem value="Home Care">Home Care</SelectItem>
                <SelectItem value="Cosmetic">Cosmetic</SelectItem>
                <SelectItem value="Adhesive">Adhesive</SelectItem>
                <SelectItem value="Industrial">Industrial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full text-white font-semibold rounded-xl shadow-md transition-all"
            style={{ backgroundColor: isGenerating ? "#999" : "#2E8B9C" }}
            data-testid="button-generate"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Formulation"
            )}
          </Button>

          {isGenerating && (
            <Alert className="bg-gray-50 border-gray-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-gray-600">
                Generating your formulation file… please wait 4–6 seconds.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Output Card */}
      {generatedContent && (
        <Card
          className="border-l-4 shadow-md overflow-hidden"
          style={{ backgroundColor: "#F7F7F7", borderLeftColor: "#2E8B9C" }}
        >
          <CardHeader>
            <CardTitle className="text-lg">Generated Formulation</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="p-6 bg-white rounded-lg border border-gray-200 max-h-96 overflow-y-auto font-mono text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: "#2A2A2A" }}
              data-testid="output-content"
            >
              {generatedContent}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mt-6">
              <Button
                onClick={handleCopy}
                className="flex-1 bg-gray-700 text-white hover:bg-gray-800 rounded-lg shadow-md transition-all"
                data-testid="button-copy"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Content
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 text-white hover:opacity-90 rounded-lg shadow-md transition-all"
                style={{ backgroundColor: "#2E8B9C" }}
                data-testid="button-save"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              <Button
                onClick={handleExportPDF}
                className="flex-1 bg-yellow-500 text-white hover:bg-yellow-600 rounded-lg shadow-md transition-all"
                data-testid="button-export"
              >
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Formulations */}
      <div>
        <h2 className="text-2xl font-bold mb-4" style={{ color: "#1A1A1A" }}>Saved Formulations</h2>
        {loadingSaved ? (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : savedFormulations.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No saved formulations yet. Generate one to get started!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {(savedFormulations as any[]).map((formula) => (
              <Card key={formula.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg" style={{ color: "#1A1A1A" }}>
                        {formula.productName}
                      </h3>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline">{formula.category}</Badge>
                        <span className="text-sm text-gray-500">
                          {format(new Date(formula.createdAt), "MMM dd, yyyy")}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setGeneratedContent(formula.content);
                          setProductName(formula.productName);
                          setCategory(formula.category);
                        }}
                        data-testid={`button-view-${formula.id}`}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteFormulation(formula.id)}
                        data-testid={`button-delete-${formula.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
