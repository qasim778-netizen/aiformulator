import { Link } from "wouter";
import { ArrowRight, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Category } from "@shared/schema";

// Minimal category structure for FORMULATION_CATEGORIES
export interface CategoryLite {
  id: string;
  name: string;
  description: string;
  image?: string;
  icon?: string;
}

interface CategoryCardProps {
  category: Category | CategoryLite;
  formulationCount: number;
  index?: number;
}

export default function CategoryCard({ category, formulationCount, index }: CategoryCardProps) {
  // Default fallback image for new formulation categories
  const defaultImage = "/api/placeholder/400/200";
  const categoryImage = 'image' in category && category.image ? category.image : defaultImage;
  
  return (
    <Link href={`/category/${category.id}`}>
      <Card className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden cursor-pointer">
        {categoryImage ? (
          <img 
            src={categoryImage} 
            alt={`${category.name} products`}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <Package className="h-16 w-16 text-blue-400" />
          </div>
        )}
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-inter font-semibold">{category.name}</h3>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {formulationCount} {formulationCount === 1 ? 'Product' : 'Products'}
            </span>
            <ArrowRight className="h-4 w-4 text-primary" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
