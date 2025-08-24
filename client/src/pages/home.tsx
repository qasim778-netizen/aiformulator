import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, FlaskConical, TrendingUp, FileText } from "lucide-react";

export default function Home() {
  const [showFormulation, setShowFormulation] = useState(false);

  const handleStartFormulation = () => {
    // For now, we'll show a placeholder. In future, this could open a modal or navigate to a form
    setShowFormulation(true);
  };

  if (showFormulation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-6xl mb-4">🚧</div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Formulation Generator Coming Soon!</h2>
          <p className="text-gray-600 mb-6">The advanced AI formulation generator is currently being developed. Check back soon for this exciting feature!</p>
          <Button onClick={() => setShowFormulation(false)} className="bg-blue-600 hover:bg-blue-700">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Formulator Agent</h1>
                <p className="text-sm text-gray-600">FREE Professional Product Formulation Tool</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 font-medium px-3 py-1">
              100% FREE
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Create Perfect Formulations
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Advanced AI-powered formulation platform with precise specifications, manufacturing 
            protocols, and comprehensive documentation.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Technical Precision */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FlaskConical className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Technical Precision</h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Scientific accuracy with precise pH levels, viscosity parameters, and validated specifications
            </p>
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs font-medium">
              ✓ Lab-Grade Accuracy
            </Badge>
          </div>

          {/* Cost Optimization */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Cost Optimization</h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Intelligent ingredient selection to maximize quality while minimizing production costs
            </p>
            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-xs font-medium">
              $ Budget-Optimized
            </Badge>
          </div>

          {/* Professional Reports */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Professional Reports</h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Comprehensive documentation with batch records, quality protocols, and specifications
            </p>
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs font-medium">
              📊 Industry Standard
            </Badge>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Button 
            onClick={handleStartFormulation}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium"
            data-testid="button-start-new-formulation"
          >
            ⚡ Start New Formulation
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            🔒 100% Free • No Registration Required • Professional Results
          </p>
        </div>
      </div>
    </div>
  );
}