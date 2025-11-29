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
  
  // Auto-detect product type from product name
  const detectProductType = (name: string): string | null => {
    const lowerName = name.toLowerCase();
    
    // Liquid keywords - check first for explicit liquid mentions
    const liquidKeywords = [
      'liquid', 'serum', 'toner', 'oil', 'spray', 'mist', 'essence',
      'lotion', 'cleanser', 'wash', 'rinse', 'solution', 'drops',
      'shampoo', 'conditioner', 'bodywash', 'handwash', 'dishwash',
      'floor cleaner', 'glass cleaner', 'all-purpose cleaner',
      'fabric softener', 'bleach', 'disinfectant'
    ];
    
    // Gel keywords
    const gelKeywords = [
      'gel', 'jelly', 'mask', 'pack', 'aloe', 'styling gel',
      'shower gel', 'hair gel', 'sanitizer', 'hand sanitizer'
    ];
    
    // Cream keywords
    const creamKeywords = [
      'cream', 'butter', 'balm', 'ointment', 'paste', 'pomade',
      'moisturizer', 'emulsion', 'thick', 'rich', 'night cream',
      'day cream', 'eye cream', 'hand cream', 'foot cream',
      'body butter', 'lip balm', 'salve'
    ];
    
    // Powder keywords (check these last as default for detergents)
    const powderKeywords = [
      'powder', 'dust', 'talc', 'foundation', 'compact', 'dry',
      'granule', 'granular', 'setting powder', 'face powder',
      'baby powder', 'talcum'
    ];
    
    // Products that default to powder form if no modifier specified
    const defaultPowderProducts = [
      'detergent', 'washing powder', 'laundry', 'dishwasher'
    ];
    
    // Check for explicit liquid mention first (highest priority)
    for (const keyword of liquidKeywords) {
      if (lowerName.includes(keyword)) {
        return 'liquid';
      }
    }
    
    // Check for gel keywords
    for (const keyword of gelKeywords) {
      if (lowerName.includes(keyword)) {
        return 'gel';
      }
    }
    
    // Check for cream keywords
    for (const keyword of creamKeywords) {
      if (lowerName.includes(keyword)) {
        return 'cream';
      }
    }
    
    // Check for explicit powder keywords
    for (const keyword of powderKeywords) {
      if (lowerName.includes(keyword)) {
        return 'powder';
      }
    }
    
    // Default powder products (like detergent without liquid modifier)
    for (const keyword of defaultPowderProducts) {
      if (lowerName.includes(keyword)) {
        return 'powder';
      }
    }
    
    return null;
  };
  
  // Auto-select product type when product name changes
  useEffect(() => {
    if (!formData.productName.trim()) return;
    
    const detectedType = detectProductType(formData.productName);
    if (detectedType && detectedType !== formData.consistencyType) {
      updateFormData({ consistencyType: detectedType });
    }
  }, [formData.productName]);
  
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
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[#1A2B4B] mb-2">What do you want to make?</h2>
        <p className="text-[#6B7280] text-lg">Tell us your desired product name and its type</p>
      </div>
      
      <div className="w-full max-w-2xl mx-auto">
        <div className="w-full min-w-0 relative bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl border-3 border-[#4A90E2] shadow-lg">
          <Label htmlFor="productName" className="text-xl font-bold text-[#1A2B4B] mb-4 block flex items-center">
            <span className="bg-[#4A90E2] text-white px-4 py-2 rounded-full text-base font-bold mr-4 w-10 h-10 flex items-center justify-center">1</span>
            Your Desired Product
          </Label>
          <Input
            ref={inputRef}
            id="productName"
            type="text"
            placeholder="e.g., Anti-Aging Face Cream, Moisturizing Shampoo, Car Detergent..."
            value={formData.productName}
            onChange={(e) => updateFormData({ productName: e.target.value })}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className="w-full h-16 border-2 border-[#4A90E2] text-lg font-medium focus:border-[#2563eb] focus:ring-2 focus:ring-blue-300 bg-white rounded-lg"
            data-testid="input-product-name"
          />
          <p className="text-sm text-[#6B7280] mt-2">Be specific! This helps us generate accurate formulas (e.g., "Coconut Moisturizing Shampoo")</p>
          
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
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-xl border-3 border-orange-200">
        <Label className="text-xl font-bold text-[#1A2B4B] mb-6 block flex items-center">
          <span className="bg-orange-500 text-white px-4 py-2 rounded-full text-base font-bold mr-4 w-10 h-10 flex items-center justify-center">2</span>
          What's the texture/consistency?
        </Label>
        <p className="text-[#6B7280] mb-6">Choose the product type that best matches your formula</p>
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
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border-2 border-emerald-200">
          <h4 className="font-bold text-[#1A2B4B] mb-4 text-base">
            ✓ Common {selectedConsistency.title.toLowerCase()} products:
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedConsistency.examples.map((example, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="bg-emerald-200 text-emerald-900 hover:bg-emerald-300 text-sm px-3 py-1.5 font-medium"
              >
                {example}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* Summary Section */}
      {formData.productName && selectedConsistency && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-6 shadow-lg">
          <h4 className="font-bold text-lg mb-2">✓ Ready to continue!</h4>
          <p className="text-sm opacity-90">
            We'll create a formula for: <span className="font-bold">{formData.productName}</span> ({selectedConsistency.title})
          </p>
        </div>
      )}
    </div>
  );
}