import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Package, CheckCircle, FileText } from "lucide-react";

interface FormData {
  budgetCategory: string;
  productionVolume: string;
  regulatoryRequirements: string[];
  additionalNotes: string;
}

interface Props {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
}

const budgetCategories = [
  {
    id: "Cost-Effective",
    title: "Cost-Effective",
    description: "Budget-friendly ingredients",
    color: "bg-green-100 text-green-800",
    icon: DollarSign
  },
  {
    id: "Medium Quality",
    title: "Medium Quality", 
    description: "Balanced cost and quality",
    color: "bg-yellow-100 text-yellow-800",
    icon: Package
  },
  {
    id: "Premium",
    title: "Premium",
    description: "High-quality premium ingredients",
    color: "bg-purple-100 text-purple-800",
    icon: CheckCircle
  }
];

const productionVolumes = [
  "Small Batch (10-100 units)",
  "Medium Batch (100-1,000 units)", 
  "Large Batch (1,000-10,000 units)",
  "Industrial Scale (10,000+ units)"
];

const regulatoryRequirements = [
  { id: "fda-approved", label: "FDA Approved", description: "US Food and Drug Administration compliance" },
  { id: "eu-compliant", label: "EU Compliant", description: "European Union regulatory standards" },
  { id: "gmp-certified", label: "GMP Certified", description: "Good Manufacturing Practice standards" },
  { id: "cruelty-free", label: "Cruelty-Free", description: "No animal testing certification" }
];

export default function RequirementsStep({ formData, updateFormData }: Props) {
  const handleRegulatoryToggle = (reqId: string, checked: boolean) => {
    const newRequirements = checked 
      ? [...formData.regulatoryRequirements, reqId]
      : formData.regulatoryRequirements.filter(id => id !== reqId);
    updateFormData({ regulatoryRequirements: newRequirements });
  };

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-indigo-900 mb-6">Cost & Production Requirements</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Budget Category */}
          <div>
            <Label className="text-base font-semibold text-green-800 mb-4 block">
              <span className="text-red-600 font-bold mr-1">9.</span> Budget Category <span className="text-red-600 font-bold">*</span>
            </Label>
            <div className="space-y-3">
              {budgetCategories.map((category) => {
                const IconComponent = category.icon;
                const isSelected = formData.budgetCategory === category.id;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => updateFormData({ budgetCategory: category.id })}
                    className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    data-testid={`budget-${category.id.toLowerCase().replace(' ', '-')}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : category.color}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                          {category.title}
                        </h4>
                        <p className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                          {category.description}
                        </p>
                      </div>
                      <div className="text-lg font-bold text-green-600">$</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Production Volume - Enhanced */}
          <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm hover:border-blue-300 transition-all duration-200">
            <Label className="text-base font-semibold text-blue-800 mb-4 block flex items-center">
              <span className="text-red-600 font-bold mr-1">10.</span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold mr-3">🏭</span>
              Production Volume <span className="text-red-600 font-bold">*</span>
            </Label>
            <Select 
              value={formData.productionVolume} 
              onValueChange={(value) => updateFormData({ productionVolume: value })}
            >
              <SelectTrigger className="w-full h-14 border-2 border-gray-300 text-lg font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200" data-testid="select-production-volume">
                <SelectValue placeholder="Choose your batch size..." />
              </SelectTrigger>
              <SelectContent>
                {productionVolumes.map((volume) => (
                  <SelectItem key={volume} value={volume}>
                    {volume}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Regulatory Requirements */}
          <div>
            <Label className="text-base font-semibold text-red-800 mb-4 block">
              <span className="text-red-600 font-bold mr-1">11.</span> Regulatory Requirements
            </Label>
            <div className="space-y-3">
              {regulatoryRequirements.map((req) => (
                <div
                  key={req.id}
                  className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <Checkbox
                    id={req.id}
                    checked={formData.regulatoryRequirements.includes(req.id)}
                    onCheckedChange={(checked) => handleRegulatoryToggle(req.id, !!checked)}
                    className="mt-1"
                    data-testid={`checkbox-${req.id}`}
                  />
                  <div className="flex-1">
                    <Label htmlFor={req.id} className="font-semibold text-gray-900 cursor-pointer block">
                      {req.label}
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">{req.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Notes - Enhanced */}
      <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm hover:border-blue-300 transition-all duration-200">
        <Label htmlFor="additionalNotes" className="text-base font-semibold text-teal-800 mb-4 block flex items-center">
          <span className="text-red-600 font-bold mr-1">12.</span>
          <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-semibold mr-3">📝</span>
          Additional Notes
        </Label>
        <Textarea
          id="additionalNotes"
          placeholder="e.g., Avoid parabens, must be cruelty-free, natural ingredients preferred, specific skin type considerations..."
          value={formData.additionalNotes}
          onChange={(e) => updateFormData({ additionalNotes: e.target.value })}
          className="w-full min-h-32 resize-y border-2 border-gray-300 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          data-testid="textarea-additional-notes"
        />
        <p className="text-sm text-gray-600 mt-3 font-medium">
          💡 Be as specific as possible to get the most accurate formulation tailored to your needs
        </p>
      </div>

      {/* Summary Preview */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FileText className="h-5 w-5 text-gray-600" />
          <h4 className="font-semibold text-gray-900">Configuration Summary</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Budget Level:</span>
            <Badge variant="secondary" className="ml-2">
              {formData.budgetCategory || "Not selected"}
            </Badge>
          </div>
          <div>
            <span className="font-medium text-gray-700">Production Volume:</span>
            <Badge variant="secondary" className="ml-2">
              {formData.productionVolume || "Not selected"}
            </Badge>
          </div>
        </div>
        {formData.regulatoryRequirements.length > 0 && (
          <div className="mt-3">
            <span className="font-medium text-gray-700">Regulatory Requirements:</span>
            <div className="flex flex-wrap gap-1 mt-2">
              {formData.regulatoryRequirements.map((req) => {
                const requirement = regulatoryRequirements.find(r => r.id === req);
                return (
                  <Badge key={req} variant="outline" className="text-xs">
                    {requirement?.label}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}