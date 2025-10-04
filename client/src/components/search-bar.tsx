import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Category, Formulation } from "@shared/schema";
import { FORMULATION_CATEGORIES } from "@/constants/categories";

interface SearchSuggestion {
  id: string;
  slug?: string; // For SEO-friendly URLs
  title: string;
  type: "category" | "formulation";
  description?: string;
}

interface SearchBarProps {
  onSearch?: (query: string) => void;
  onSelect?: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({ 
  onSearch, 
  onSelect, 
  placeholder = "Search formulations or categories…",
  className = "w-64" 
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [, setLocation] = useLocation();
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use the new 22 formulation categories for suggestions
  const categories = FORMULATION_CATEGORIES;

  const { data: formulations = [] } = useQuery<Formulation[]>({
    queryKey: ["/api/formulations"],
  });

  // Update suggestions when query changes (with debounced effect)
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    // Only process if we have data to avoid infinite loops
    if (!categories.length && !formulations.length) {
      return;
    }

    const lowerQuery = query.toLowerCase();
    const allSuggestions: SearchSuggestion[] = [];

    // Add category suggestions
    categories.forEach(category => {
      if (category.name.toLowerCase().includes(lowerQuery) || 
          category.description.toLowerCase().includes(lowerQuery)) {
        allSuggestions.push({
          id: category.id,
          title: category.name,
          type: "category",
          description: category.description
        });
      }
    });

    // Add formulation suggestions
    formulations.forEach(formulation => {
      if (formulation.name.toLowerCase().includes(lowerQuery) || 
          formulation.description.toLowerCase().includes(lowerQuery)) {
        // Find category by either new ID (slug) or old database UUID
        const category = categories.find(c => 
          c.id === formulation.categoryId || c.dbCategoryId === formulation.categoryId
        );
        allSuggestions.push({
          id: formulation.id,
          slug: formulation.slug, // Use slug for SEO-friendly URLs
          title: formulation.name,
          type: "formulation",
          description: `${category?.name || "Unknown Category"} - ${formulation.description.substring(0, 80)}...`
        });
      }
    });

    // Limit to top 8 suggestions and prioritize categories first
    const newSuggestions = allSuggestions
      .sort((a, b) => a.type === "category" ? -1 : 1)
      .slice(0, 8);

    setSuggestions(newSuggestions);
    setSelectedIndex(-1);
    setIsOpen(newSuggestions.length > 0);
  }, [query]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  // Handle input focus
  const handleFocus = () => {
    if (query.trim()) {
      setIsOpen(suggestions.length > 0);
    }
  };

  // Handle input blur (with delay to allow clicking on suggestions)
  const handleBlur = () => {
    setTimeout(() => setIsOpen(false), 150);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

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
          handleSelectSuggestion(suggestions[selectedIndex]);
        } else if (query.trim()) {
          handleSearch(query);
          setIsOpen(false);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.title);
    setIsOpen(false);
    setSelectedIndex(-1);
    
    // Navigate to the appropriate page based on suggestion type
    if (suggestion.type === "category") {
      // Use slug for categories (suggestion.id is the slug from categories constant)
      setLocation(`/category/${suggestion.id}`);
    } else if (suggestion.type === "formulation") {
      // Use slug for formulations for SEO-friendly URLs
      setLocation(`/formulation/${suggestion.slug || suggestion.id}`);
    }
    
    if (onSelect) {
      onSelect(suggestion);
    }
  };

  // Handle search execution
  const handleSearch = (searchQuery: string) => {
    console.log('SearchBar handleSearch called with:', searchQuery);
    const trimmedQuery = searchQuery.trim();
    
    if (!trimmedQuery) return;

    // First, look for formulation matches and show them as cards
    const matchingFormulations = formulations.filter(f => 
      f.name.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(trimmedQuery.toLowerCase())
    );
    
    if (matchingFormulations.length > 0) {
      // Find the category of the first matching formulation
      const firstMatch = matchingFormulations[0];
      const matchCategory = categories.find(c => c.dbCategoryId === firstMatch.categoryId || c.id === firstMatch.categoryId);
      
      if (matchCategory) {
        console.log('Found formulation matches, showing category with highlight:', matchCategory.name);
        setLocation(`/category/${matchCategory.id}?highlight=${firstMatch.id}&search=${encodeURIComponent(trimmedQuery)}`);
        return;
      }
    }

    // If no formulation matches, try to find category matches
    const exactCategoryMatch = categories.find(c => 
      c.name.toLowerCase() === trimmedQuery.toLowerCase()
    );
    
    if (exactCategoryMatch) {
      console.log('Found exact category match:', exactCategoryMatch.name);
      setLocation(`/category/${exactCategoryMatch.id}`);
      return;
    }

    // If no exact category match, find the most relevant category
    const relevantCategory = categories.find(c => 
      c.name.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(trimmedQuery.toLowerCase())
    );
    
    if (relevantCategory) {
      console.log('Found relevant category:', relevantCategory.name);
      setLocation(`/category/${relevantCategory.id}`);
      return;
    }

    // If no direct matches, fall back to browse page search
    if (onSearch) {
      console.log('No direct matches, using browse page search');
      onSearch(trimmedQuery);
    }
  };

  // Clear search
  const clearSearch = () => {
    setQuery("");
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Highlight matching text in suggestions
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-medium">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className={`relative ${className}`}>
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) {
            handleSearch(query);
            setIsOpen(false);
          }
        }}
        className="relative"
      >
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-4 py-2 rounded-md border border-gray-300 bg-white focus:border-gray-400 focus:ring-0 focus:outline-none transition-colors"
          data-testid="input-search-query"
        />
        <button
          type="submit"
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        >
          <Search className="h-4 w-4" />
        </button>
      </form>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
          data-testid="dropdown-search-suggestions"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150 ${
                index === selectedIndex
                  ? "bg-primary text-white"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => handleSelectSuggestion(suggestion)}
              data-testid={`suggestion-${suggestion.type}-${suggestion.id}`}
            >
              <div className="flex items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <span className="font-medium text-sm">
                      {highlightText(suggestion.title, query)}
                    </span>
                    <span 
                      className={`ml-2 px-2 py-1 text-xs rounded-full font-medium ${
                        index === selectedIndex
                          ? "bg-white text-primary"
                          : suggestion.type === "category" 
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {suggestion.type === "category" ? "Category" : "Formula"}
                    </span>
                  </div>
                  {suggestion.description && (
                    <p className={`text-xs ${
                      index === selectedIndex 
                        ? "text-blue-100" 
                        : "text-gray-600"
                    }`}>
                      {highlightText(suggestion.description, query)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}