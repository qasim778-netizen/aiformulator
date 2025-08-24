import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Droplet, Zap, Shield, Leaf, Sparkles, Sun, Baby, Flower } from "lucide-react";

interface FormData {
  viscosity: string;
  specialProperties: string[];
  phLevel: number;
  shelfLife: number;
  storageTemperature: string;
}

interface Props {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
}

const viscosityOptions = [
  {
    id: "low",
    title: "Low Viscosity",
    description: "Water-like consistency",
    examples: "Serums, toners, mists"
  },
  {
    id: "medium",
    title: "Medium Viscosity", 
    description: "Lotion-like consistency",
    examples: "Lotions, gels, light creams"
  },
  {
    id: "high",
    title: "High Viscosity",
    description: "Thick paste consistency",
    examples: "Heavy creams, balms, ointments"
  },
  {
    id: "custom",
    title: "Custom Specification",
    description: "Define your own viscosity",
    examples: "Specialized formulations"
  }
];

const specialProperties = [
  { id: "anti-aging", label: "Anti-aging", icon: Sun },
  { id: "moisturizing", label: "Moisturizing", icon: Droplet },
  { id: "uv-protection", label: "UV Protection", icon: Shield },
  { id: "anti-inflammatory", label: "Anti-inflammatory", icon: Leaf },
  { id: "brightening", label: "Brightening", icon: Sparkles },
  { id: "firming", label: "Firming", icon: Zap },
  { id: "hypoallergenic", label: "Hypoallergenic", icon: Baby },
  { id: "fragrance-free", label: "Fragrance-free", icon: Flower },
  { id: "paraben-free", label: "Paraben-free", icon: Leaf },
  { id: "organic-certified", label: "Organic certified", icon: Leaf },
];

const storageTemperatures = [
  "Room Temperature (15-25°C)",
  "Cool Storage (2-8°C)", 
  "Refrigerated (0-4°C)",
  "Controlled Room Temp (20-25°C)",
  "Below 30°C"
];

export default function SpecificationsStep({ formData, updateFormData }: Props) {
  const handleSpecialPropertyToggle = (propertyId: string, checked: boolean) => {
    const newProperties = checked 
      ? [...formData.specialProperties, propertyId]
      : formData.specialProperties.filter(id => id !== propertyId);
    updateFormData({ specialProperties: newProperties });
  };

  const getPhLevelLabel = (value: number) => {
    if (value < 3) return "Very Acidic";
    if (value < 6) return "Acidic";
    if (value < 8) return "Neutral";
    if (value < 11) return "Basic";
    return "Very Basic";
  };

  return (
    <div className="space-y-4 w-full overflow-hidden">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Technical Specifications</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
        {/* Left Column */}
        <div className="space-y-4 w-full min-w-0">
          {/* Target Viscosity */}
          <div>
            <Label className="text-sm font-semibold text-gray-900 mb-2 block">
              Target Viscosity
            </Label>
            <RadioGroup 
              value={formData.viscosity} 
              onValueChange={(value) => updateFormData({ viscosity: value })}
              className="space-y-2"
            >
              {viscosityOptions.map((option) => (
                <div key={option.id}>
                  <div className={`flex items-center space-x-2 p-2 rounded-lg border transition-colors ${
                    formData.viscosity === option.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                  }`}>
                    <RadioGroupItem value={option.id} id={option.id} />
                    <div className="flex-1">
                      <Label htmlFor={option.id} className="text-sm font-medium text-gray-900 cursor-pointer">
                        {option.title}
                      </Label>
                      <p className="text-xs text-gray-600">{option.description}</p>
                      <p className="text-xs text-gray-500">Examples: {option.examples}</p>
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>


        </div>

        {/* Right Column */}
        <div className="space-y-4 w-full min-w-0">
          {/* Special Properties */}
          <div>
            <Label className="text-sm font-semibold text-gray-900 mb-2 block">
              Special Properties (skincare - cream)
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {specialProperties.map((property) => {
                const IconComponent = property.icon;
                return (
                  <div
                    key={property.id}
                    className="flex items-center space-x-2 p-2 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <Checkbox
                      id={property.id}
                      checked={formData.specialProperties.includes(property.id)}
                      onCheckedChange={(checked) => handleSpecialPropertyToggle(property.id, !!checked)}
                      data-testid={`checkbox-${property.id}`}
                    />
                    <div className="flex items-center space-x-1 flex-1">
                      <IconComponent className="h-3 w-3 text-gray-600" />
                      <Label htmlFor={property.id} className="text-xs font-medium cursor-pointer">
                        {property.label}
                      </Label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* pH Level */}
          <div>
            <Label className="text-sm font-semibold text-gray-900 mb-2 block">
              pH Level
            </Label>
            <div className="px-3 py-2 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                <span>1 (Acidic)</span>
                <span className="text-blue-600">Current pH: {formData.phLevel}</span>
                <span>14 (Basic)</span>
              </div>
              <Slider
                value={[formData.phLevel]}
                onValueChange={([value]) => updateFormData({ phLevel: value })}
                min={1}
                max={14}
                step={0.1}
                className="w-full"
                data-testid="slider-ph-level"
              />
              <div className="text-center mt-1">
                <span className="text-xs font-medium text-gray-900">
                  {getPhLevelLabel(formData.phLevel)}
                </span>
              </div>
            </div>
          </div>

          {/* Shelf Life & Storage Temperature - Horizontal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="shelfLife" className="text-sm font-semibold text-gray-900 mb-2 block">
                Shelf Life (months)
              </Label>
              <Input
                id="shelfLife"
                type="number"
                value={formData.shelfLife}
                onChange={(e) => updateFormData({ shelfLife: parseInt(e.target.value) || 12 })}
                min={1}
                max={60}
                className="w-full h-10"
                data-testid="input-shelf-life"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-900 mb-2 block">
                Storage Temperature
              </Label>
              <Select 
                value={formData.storageTemperature} 
                onValueChange={(value) => updateFormData({ storageTemperature: value })}
              >
                <SelectTrigger className="w-full h-10" data-testid="select-storage-temperature">
                  <SelectValue placeholder="Select storage..." />
                </SelectTrigger>
                <SelectContent>
                  {storageTemperatures.map((temp) => (
                    <SelectItem key={temp} value={temp}>
                      {temp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}