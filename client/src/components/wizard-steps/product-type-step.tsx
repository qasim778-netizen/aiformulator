import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Hand, Droplets, Waves, Circle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Formulation } from "@shared/schema";

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
    icon: Hand,
    examples: ["Face cream", "Night cream", "Eye cream", "Body lotion"],
    colors: {
      bg: "bg-gradient-to-br from-orange-50 to-yellow-50",
      border: "border-orange-200",
      selectedBg: "bg-gradient-to-br from-orange-100 to-yellow-100",
      selectedBorder: "border-orange-500",
      icon: "text-orange-600",
      selectedIcon: "text-orange-700",
      title: "text-orange-900",
      desc: "text-orange-700",
      selectedTitle: "text-orange-900",
      selectedDesc: "text-orange-800"
    }
  },
  {
    id: "liquid",
    title: "Liquid/Serum",
    description: "Flowing consistency",
    icon: Droplets,
    examples: ["Toner", "Serum", "Oil", "Cleanser"],
    colors: {
      bg: "bg-gradient-to-br from-blue-50 to-cyan-50",
      border: "border-blue-200",
      selectedBg: "bg-gradient-to-br from-blue-100 to-cyan-100",
      selectedBorder: "border-blue-500",
      icon: "text-blue-600",
      selectedIcon: "text-blue-700",
      title: "text-blue-900",
      desc: "text-blue-700",
      selectedTitle: "text-blue-900",
      selectedDesc: "text-blue-800"
    }
  },
  {
    id: "gel",
    title: "Gel",
    description: "Semi-solid texture",
    icon: Waves,
    examples: ["Aloe gel", "Hair gel", "Face mask", "Body gel"],
    colors: {
      bg: "bg-gradient-to-br from-emerald-50 to-green-50",
      border: "border-emerald-200",
      selectedBg: "bg-gradient-to-br from-emerald-100 to-green-100",
      selectedBorder: "border-emerald-500",
      icon: "text-emerald-600",
      selectedIcon: "text-emerald-700",
      title: "text-emerald-900",
      desc: "text-emerald-700",
      selectedTitle: "text-emerald-900",
      selectedDesc: "text-emerald-800"
    }
  },
  {
    id: "powder",
    title: "Powder/Foundation",
    description: "Dry, granular",
    icon: Circle,
    examples: ["Face powder", "Foundation", "Dry shampoo", "Setting powder"],
    colors: {
      bg: "bg-gradient-to-br from-purple-50 to-pink-50",
      border: "border-purple-200",
      selectedBg: "bg-gradient-to-br from-purple-100 to-pink-100",
      selectedBorder: "border-purple-500",
      icon: "text-purple-600",
      selectedIcon: "text-purple-700",
      title: "text-purple-900",
      desc: "text-purple-700",
      selectedTitle: "text-purple-900",
      selectedDesc: "text-purple-800"
    }
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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedConsistency = consistencyTypes.find(type => type.id === formData.consistencyType);
  
  // Fetch formulations for autocomplete suggestions
  const { data: formulations = [] } = useQuery<Formulation[]>({
    queryKey: ["/api/formulations"],
  });
  
  // Update suggestions when product name changes
  useEffect(() => {
    if (!formData.productName.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
      return;
    }
    
    const query = formData.productName.toLowerCase();
    const matchingSuggestions = formulations
      .filter(f => f.name.toLowerCase().includes(query))
      .map(f => f.name)
      .filter(name => name.toLowerCase() !== query) // Don't suggest exact matches
      .slice(0, 6); // Limit to 6 suggestions
    
    setSuggestions(matchingSuggestions);
    setShowSuggestions(matchingSuggestions.length > 0);
    setSelectedIndex(-1);
  }, [formData.productName, formulations]);
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;
    
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          updateFormData({ productName: suggestions[selectedIndex] });
          setShowSuggestions(false);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };
  
  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: string) => {
    updateFormData({ productName: suggestion });
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };
  
  // Handle input blur (with delay to allow clicking suggestions)
  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 150);
  };
  
  // Handle input focus
  const handleFocus = () => {
    if (formData.productName.trim() && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-indigo-900 mb-4">Product Type Selection</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
        <div className="w-full min-w-0 bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm hover:border-blue-300 transition-all duration-200">
          <Label htmlFor="productCategory" className="text-lg font-bold text-purple-800 mb-4 block flex items-center">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold mr-3">1</span>
            Product Category *
          </Label>
          <Select 
            value={formData.productCategory} 
            onValueChange={(value) => updateFormData({ productCategory: value })}
          >
            <SelectTrigger className="w-full h-14 border-2 border-gray-300 text-lg font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200" data-testid="select-product-category">
              <SelectValue placeholder="Select product category..." />
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

        <div className="w-full min-w-0 relative bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm hover:border-blue-300 transition-all duration-200">
          <Label htmlFor="productName" className="text-lg font-bold text-emerald-800 mb-4 block flex items-center">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold mr-3">2</span>
            Product Name *
          </Label>
          <Input
            ref={inputRef}
            id="productName"
            type="text"
            placeholder="e.g., Anti-Aging Face Cream, Moisturizing Shampoo..."
            value={formData.productName}
            onChange={(e) => updateFormData({ productName: e.target.value })}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className="w-full h-14 border-2 border-gray-300 text-lg font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            data-testid="input-product-name"
          />
          
          {/* Autocomplete Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
              data-testid="dropdown-product-suggestions"
            >
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion}
                  className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150 ${
                    index === selectedIndex
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  data-testid={`suggestion-product-${index}`}
                >
                  <span className="font-medium text-sm">
                    {suggestion}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Consistency Type Selection */}
      <div>
        <Label className="text-base font-semibold text-orange-800 mb-4 block">
          Consistency Type
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {consistencyTypes.map((type) => {
            const IconComponent = type.icon;
            const isSelected = formData.consistencyType === type.id;
            const colors = type.colors;
            
            return (
              <button
                key={type.id}
                onClick={() => updateFormData({ consistencyType: type.id })}
                className={`p-5 rounded-xl border-2 transition-all duration-300 text-center hover:shadow-lg hover:scale-105 transform ${
                  isSelected 
                    ? `${colors.selectedBg} ${colors.selectedBorder} shadow-lg scale-105` 
                    : `${colors.bg} ${colors.border} hover:${colors.selectedBorder}`
                }`}
                data-testid={`consistency-${type.id}`}
              >
                <div className={`mx-auto mb-3 w-14 h-14 flex items-center justify-center rounded-full ${
                  isSelected 
                    ? `${colors.selectedIcon} bg-white/50` 
                    : `${colors.icon} bg-white/30`
                } transition-all duration-300`}>
                  <IconComponent className="h-8 w-8" />
                </div>
                <h4 className={`font-bold mb-2 text-sm ${
                  isSelected ? colors.selectedTitle : colors.title
                } transition-colors duration-300`}>
                  {type.title}
                </h4>
                <p className={`text-xs ${
                  isSelected ? colors.selectedDesc : colors.desc
                } transition-colors duration-300`}>
                  {type.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Examples Section */}
      {selectedConsistency && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-semibold text-gray-900 mb-3 text-sm">
            Examples for {formData.productCategory || 'skincare'} - {selectedConsistency.title.toLowerCase()}:
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedConsistency.examples.map((example, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs px-2 py-1"
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