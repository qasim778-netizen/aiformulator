import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Category } from "@shared/schema";

interface CategoryCardProps {
  category: Category;
  formulationCount: number;
  index?: number;
}

export default function CategoryCard({ category, formulationCount, index }: CategoryCardProps) {
  return (
    <Link href={`/category/${category.id}`}>
      <Card className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden cursor-pointer">
        <img 
          src={category.image} 
          alt={`${category.name} products`}
          className="w-full h-48 object-cover"
        />
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-inter font-semibold">{category.name}</h3>
            {index !== undefined && (
              <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
                #{index + 1}
              </span>
            )}
          </div>
          <p className="text-gray-600 text-sm mb-4">{category.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-primary font-medium">{formulationCount} Products</span>
            <ArrowRight className="h-4 w-4 text-primary" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
