import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertFormulationContentSchema } from "@shared/schema";
import type { FormulationContent, InsertFormulationContent } from "@shared/schema";

interface FormulationContentFormProps {
  formulationId: string;
  formulationName: string;
  existingContent?: FormulationContent | null;
  onSuccess: () => void;
}

export default function FormulationContentForm({
  formulationId,
  formulationName,
  existingContent,
  onSuccess
}: FormulationContentFormProps) {
  const { toast } = useToast();

  const form = useForm<InsertFormulationContent>({
    resolver: zodResolver(insertFormulationContentSchema),
    defaultValues: {
      formulationId,
      overviewTitle: existingContent?.overviewTitle || "Product Overview",
      overviewContent: existingContent?.overviewContent || "",
      benefitsTitle: existingContent?.benefitsTitle || "Key Benefits",
      benefitsContent: existingContent?.benefitsContent || "",
      applicationsTitle: existingContent?.applicationsTitle || "Applications",
      applicationsContent: existingContent?.applicationsContent || "",
      usageTitle: existingContent?.usageTitle || "Usage Instructions",
      usageContent: existingContent?.usageContent || "",
      safetyTitle: existingContent?.safetyTitle || "Safety Information",
      safetyContent: existingContent?.safetyContent || "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: InsertFormulationContent) => {
      const response = await apiRequest("POST", "/api/formulation-content", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Formulation content saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/formulation-content", formulationId] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save formulation content",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertFormulationContent) => {
    submitMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Customize Page Content for: {formulationName}</h3>
        <p className="text-sm text-gray-600">
          Add custom content that will be displayed on the public formulation page instead of auto-generated content.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Overview Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Product Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="overviewTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section Title</FormLabel>
                    <FormControl>
                      <input
                        type="text"
                        {...field}
                        value={field.value || ""}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g., Product Overview"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="overviewContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content (HTML supported)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder="Add your custom overview content here..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Benefits Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Key Benefits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="benefitsTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section Title</FormLabel>
                    <FormControl>
                      <input
                        type="text"
                        {...field}
                        value={field.value || ""}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g., Key Benefits"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="benefitsContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content (HTML supported)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder="List the key benefits of this formulation..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Applications Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Applications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="applicationsTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section Title</FormLabel>
                    <FormControl>
                      <input
                        type="text"
                        {...field}
                        value={field.value || ""}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g., Applications"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="applicationsContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content (HTML supported)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder="Describe the applications and use cases..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Usage Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Usage Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="usageTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section Title</FormLabel>
                    <FormControl>
                      <input
                        type="text"
                        {...field}
                        value={field.value || ""}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g., Usage Instructions"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="usageContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content (HTML supported)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder="Provide detailed usage instructions..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Safety Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Safety Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="safetyTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section Title</FormLabel>
                    <FormControl>
                      <input
                        type="text"
                        {...field}
                        value={field.value || ""}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g., Safety Information"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="safetyContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content (HTML supported)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder="Add safety warnings and precautions..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={submitMutation.isPending}
            className="w-full bg-primary hover:bg-primary/90 text-white"
            data-testid="button-save-formulation-content"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Custom Content
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
