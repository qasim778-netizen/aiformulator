import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";

interface AdminFeaturesManagerProps {
  formulationId: string;
}

const DEFAULT_FEATURES = [
  "Title",
  "Entity Block",
  "What Is Product",
  "Key Ingredients",
  "Manufacturing Process",
  "Usage Instructions",
  "Safety Data",
  "Storage Conditions",
  "Quality Assurance",
  "Certifications",
  "Technical Specifications",
  "Shelf Life",
  "Packaging Details",
  "Production Considerations",
  "Additional Information"
];

export default function AdminFeaturesManager({ formulationId }: AdminFeaturesManagerProps) {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const { data: features = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/formulations/${formulationId}/features`],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("POST", `/api/formulations/${formulationId}/features`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/formulations/${formulationId}/features`] });
      toast({ title: "Feature created successfully" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("PATCH", `/api/formulations/${formulationId}/features/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/formulations/${formulationId}/features`] });
      setEditingId(null);
      toast({ title: "Feature updated successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (featureId: string) =>
      apiRequest("DELETE", `/api/formulations/${formulationId}/features/${featureId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/formulations/${formulationId}/features`] });
      toast({ title: "Feature deleted successfully" });
    },
  });

  const addDefaultFeatures = async () => {
    for (let i = 0; i < DEFAULT_FEATURES.length; i++) {
      await createMutation.mutateAsync({
        featureName: DEFAULT_FEATURES[i],
        featureContent: "",
        featureOrder: i + 1,
        isRequired: i < 5,
      });
    }
  };

  if (isLoading) return <div className="p-4">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Manage Features</h2>
        {features.length === 0 && (
          <Button onClick={addDefaultFeatures} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Default Features
          </Button>
        )}
      </div>

      {features.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No features yet. Create default features to get started.</p>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {features
            .sort((a, b) => a.featureOrder - b.featureOrder)
            .map((feature) => (
              <div key={feature.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{feature.featureName}</h3>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(feature.id)}
                    className="text-red-600 hover:text-red-700"
                    data-testid={`button-delete-feature-${feature.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {editingId === feature.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Enter feature content..."
                      className="min-h-24"
                      data-testid={`textarea-edit-feature-${feature.id}`}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          updateMutation.mutate({
                            id: feature.id,
                            featureContent: editContent,
                          });
                        }}
                        data-testid={`button-save-feature-${feature.id}`}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                        data-testid={`button-cancel-edit-${feature.id}`}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      {feature.featureContent || <span className="italic text-gray-400">No content added</span>}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(feature.id);
                        setEditContent(feature.featureContent || "");
                      }}
                      data-testid={`button-edit-feature-${feature.id}`}
                    >
                      Edit
                    </Button>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
