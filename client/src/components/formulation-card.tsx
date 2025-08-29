import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Formulation } from "@shared/schema";

interface FormulationCardProps {
  formulation: Formulation;
}

export default function FormulationCard({ formulation }: FormulationCardProps) {
  const ingredients = JSON.parse(formulation.ingredients);

  return (
    <Card className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-inter font-semibold text-gray-900">{formulation.name}</h3>
          <Badge className={formulation.isActive ? "bg-success text-white" : "bg-yellow-500 text-white"}>
            {formulation.isActive ? "Active" : "Draft"}
          </Badge>
        </div>
        <p className="text-gray-600 mb-4">{formulation.description}</p>
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
        <Link href={`/formulation/${formulation.slug || formulation.id}`}>
          <Button className="w-full bg-primary text-white hover:bg-blue-700">
            View Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
