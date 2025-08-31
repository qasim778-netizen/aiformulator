import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Globe, Star, Users, Beaker, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface RegionalTrendingFormulation {
  name: string;
  category: string;
  description: string;
  popularityScore: number;
  keyIngredients: string[];
  targetMarket: string;
  region: 'Asia' | 'USA' | 'Europe';
  trendReason: string;
}

const regionFlags: { [key: string]: string } = {
  'Asia': '🌏',
  'USA': '🇺🇸',
  'Europe': '🇪🇺'
};

const regionColors: { [key: string]: string } = {
  'Asia': 'bg-red-100 text-red-800',
  'USA': 'bg-blue-100 text-blue-800',
  'Europe': 'bg-green-100 text-green-800'
};

export default function TrendingFormulations() {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const { data: formulations = [], isLoading, error } = useQuery<RegionalTrendingFormulation[]>({
    queryKey: ["trending-formulations"],
    queryFn: async () => {
      const response = await fetch("/api/ai-blog/trending-formulations", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    },
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  });

  const toggleCardExpansion = (index: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedCards(newExpanded);
  };

  const filteredFormulations = selectedRegion === 'all' 
    ? formulations 
    : formulations.filter(f => f.region === selectedRegion);

  const groupedByRegion = formulations.reduce((acc, formulation) => {
    if (!acc[formulation.region]) {
      acc[formulation.region] = [];
    }
    acc[formulation.region].push(formulation);
    return acc;
  }, {} as { [key: string]: RegionalTrendingFormulation[] });

  // Sort formulations by popularity score within each region
  Object.keys(groupedByRegion).forEach(region => {
    groupedByRegion[region].sort((a, b) => b.popularityScore - a.popularityScore);
  });

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Unable to load trending formulations at the moment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center">
          <TrendingUp className="mr-3 h-8 w-8 text-purple-600" />
          Top Trending Product Formulations
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover the most popular formulations across Asia, USA, and Europe based on current market trends and consumer demand.
        </p>
      </div>

      {/* Region Filter */}
      <div className="flex justify-center">
        <div className="flex space-x-2 p-1 bg-gray-100 rounded-lg">
          <Button
            variant={selectedRegion === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedRegion('all')}
            className="rounded-md"
            data-testid="filter-all"
          >
            <Globe className="mr-2 h-4 w-4" />
            All Regions
          </Button>
          {Object.keys(groupedByRegion).map((region) => (
            <Button
              key={region}
              variant={selectedRegion === region ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedRegion(region)}
              className="rounded-md"
              data-testid={`filter-${region.toLowerCase()}`}
            >
              <span className="mr-2">{regionFlags[region]}</span>
              {region}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Analyzing global formulation trends...</p>
        </div>
      )}

      {/* Formulations Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFormulations.map((formulation, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge className={`text-xs font-medium ${regionColors[formulation.region]}`}>
                    {regionFlags[formulation.region]} {formulation.region}
                  </Badge>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="text-sm font-semibold text-gray-700">
                      {formulation.popularityScore}
                    </span>
                  </div>
                </div>
                <CardTitle className="text-lg leading-tight">
                  {formulation.name}
                </CardTitle>
                <Badge variant="outline" className="w-fit text-xs">
                  {formulation.category}
                </Badge>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {formulation.description}
                </p>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Key Ingredients
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {formulation.keyIngredients.slice(0, 3).map((ingredient, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {ingredient}
                        </Badge>
                      ))}
                      {formulation.keyIngredients.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{formulation.keyIngredients.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-8 text-xs text-purple-600 hover:text-purple-700"
                        onClick={() => toggleCardExpansion(index)}
                        data-testid={`expand-formulation-${index}`}
                      >
                        {expandedCards.has(index) ? (
                          <>
                            <ChevronUp className="h-3 w-3 mr-1" />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3 mr-1" />
                            Show Details
                          </>
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 pt-2">
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          Target Market
                        </h4>
                        <p className="text-xs text-gray-600">{formulation.targetMarket}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 flex items-center">
                          <Beaker className="h-3 w-3 mr-1" />
                          Why It's Trending
                        </h4>
                        <p className="text-xs text-gray-600">{formulation.trendReason}</p>
                      </div>

                      {formulation.keyIngredients.length > 3 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            All Ingredients
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {formulation.keyIngredients.map((ingredient, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {ingredient}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredFormulations.length === 0 && (
        <div className="text-center py-12">
          <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No trending formulations available for the selected region.</p>
        </div>
      )}
    </div>
  );
}