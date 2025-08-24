import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Droplets, Waves, Beaker, Sparkles } from "lucide-react";

interface FormData {
  productName: string;
  productCategory: string;
  consistencyType: string;
}

interface Props {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
}

const consistencyTypes = [
  {
    id: "cream",
    title: "Cream",
    description: "Thick, spreadable",
    icon: Droplets,
    examples: ["Face cream", "Night cream", "Eye cream", "Body lotion"]
  },
  {
    id: "liquid",
    title: "Liquid/Serum",
    description: "Flowing consistency",
    icon: Waves,
    examples: ["Toner", "Serum", "Oil", "Cleanser"]
  },
  {
    id: "gel",
    title: "Gel",
    description: "Semi-solid texture",
    icon: Beaker,
    examples: ["Aloe gel", "Hair gel", "Face mask", "Body gel"]
  },
  {
    id: "powder",
    title: "Powder/Foundation",
    description: "Dry, granular",
    icon: Sparkles,
    examples: ["Face powder", "Foundation", "Dry shampoo", "Setting powder"]
  }
];

const productCategories = [
  "Skincare & Cosmetics",
  "Hair Care Products",
  "Body Care & Personal Hygiene",
  "Oral Care Products",
  "Cleaning & Household",
  "Industrial & Specialty",
  "Organic & Natural Products",
  "Baby & Child Care",
  "Pet Care Products",
  "Pharmaceutical & Medical"
];

export default function ProductTypeStep({ formData, updateFormData }: Props) {
  const selectedConsistency = consistencyTypes.find(type => type.id === formData.consistencyType);

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Product Type Selection</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          <div>
            <Label htmlFor="productCategory" className="text-base font-semibold text-gray-900 mb-3 block">
              Product Category
            </Label>
            <Select 
              value={formData.productCategory} 
              onValueChange={(value) => updateFormData({ productCategory: value })}
            >
              <SelectTrigger className="w-full h-12" data-testid="select-product-category">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {productCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="productName" className="text-base font-semibold text-gray-900 mb-3 block">
              Product Name
            </Label>
            <Input
              id="productName"
              type="text"
              placeholder="Enter product name..."
              value={formData.productName}
              onChange={(e) => updateFormData({ productName: e.target.value })}
              className="w-full h-12"
              data-testid="input-product-name"
            />
          </div>
        </div>

        {/* Right Column - Placeholder for future content */}
        <div></div>
      </div>

      {/* Consistency Type Selection */}
      <div>
        <Label className="text-base font-semibold text-gray-900 mb-4 block">
          Consistency Type
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {consistencyTypes.map((type) => {
            const IconComponent = type.icon;
            const isSelected = formData.consistencyType === type.id;
            
            return (
              <button
                key={type.id}
                onClick={() => updateFormData({ consistencyType: type.id })}
                className={`p-6 rounded-xl border-2 transition-all duration-200 text-left hover:shadow-md ${
                  isSelected 
                    ? 'border-blue-600 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                data-testid={`consistency-${type.id}`}
              >
                <div className={`p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-3 ${
                  isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <h4 className={`font-semibold mb-1 ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                  {type.title}
                </h4>
                <p className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                  {type.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Examples Section */}
      {selectedConsistency && (
        <div className="bg-gray-50 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-3">
            Examples for {formData.productCategory || 'selected category'} - {selectedConsistency.title}:
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedConsistency.examples.map((example, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="bg-blue-100 text-blue-800 hover:bg-blue-200"
              >
                {example}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}