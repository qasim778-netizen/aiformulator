import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FormulationContentForm from "@/components/admin/formulation-content-form";
import type { Formulation } from "@shared/schema";

export default function FormulationContentManagementTab() {
  const [selectedFormulationId, setSelectedFormulationId] = useState<string>("");

  const { data: formulations = [] } = useQuery<Formulation[]>({
    queryKey: ["/api/formulations"],
  });

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
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Select Formulation
              </label>
              <Select value={selectedFormulationId} onValueChange={setSelectedFormulationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a formulation to customize..." />
                </SelectTrigger>
                <SelectContent>
                  {formulations.map((formulation) => (
                    <SelectItem key={formulation.id} value={formulation.id}>
                      {formulation.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedFormulation && (
              <FormulationContentForm
                formulationId={selectedFormulation.id}
                formulationName={selectedFormulation.name}
                onSuccess={() => {
                  setSelectedFormulationId("");
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
