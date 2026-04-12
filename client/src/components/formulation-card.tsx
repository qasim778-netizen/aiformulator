import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FlaskConical } from "lucide-react";
import type { Formulation } from "@shared/schema";

interface FormulationCardProps {
  formulation: Formulation;
}

export default function FormulationCard({ formulation }: FormulationCardProps) {
  const ingredients = JSON.parse(formulation.ingredients);
  const imageSrc = formulation.thumbnail || formulation.image;

  return (
    <Card className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 overflow-hidden">
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={formulation.imageAlt || formulation.name}
          className="w-full h-48 object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <FlaskConical className="h-12 w-12 text-blue-300" />
        </div>
      )}
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-inter font-semibold text-gray-900 line-clamp-2">{formulation.name}</h3>
          <Badge className={formulation.isActive ? "bg-success text-white" : "bg-yellow-500 text-white"}>
            {formulation.isActive ? "Active" : "Draft"}
          </Badge>
        </div>
        <p className="text-gray-600 mb-4 line-clamp-2">{formulation.description}</p>
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">pH Level:</span>
            <span className="font-medium">{formulation.phLevel}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Shelf Life:</span>
            <span className="font-medium">{formulation.shelfLife}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Ingredients:</span>
            <span className="font-medium">{ingredients.length} components</span>
          </div>
        </div>
        <a
          href={`/formulation/${formulation.slug || formulation.id}`}
        >
          <Button className="w-full bg-primary text-white hover:bg-blue-700">
            View Details
          </Button>
        </a>
      </CardContent>
    </Card>
  );
}
