import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, FlaskConical, TrendingUp, FileText, Check, ArrowRight } from "lucide-react";

export default function Home() {
  const [showFormulation, setShowFormulation] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    productCategory: "skincare-cosmetics",
    productName: "",
    consistencyType: "cream"
  });

  const handleStartFormulation = () => {
    setShowFormulation(true);
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBackToHome = () => {
    setShowFormulation(false);
    setCurrentStep(1);
    setFormData({
      productCategory: "skincare-cosmetics",
      productName: "",
      consistencyType: "cream"
    });
  };

  if (showFormulation) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">FREE Professional Product Formulation Tool</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Progress Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-blue-600 mb-2">Formulation Process</h2>
              <p className="text-blue-600 text-sm">⭕ Step 1 of 4</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center">
                {/* Step 1 */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mb-2">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Product Type</span>
                </div>
                
                {/* Connector */}
                <div className="w-20 h-1 bg-blue-600 mx-4"></div>
                
                {/* Step 2 */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                    <Settings className="w-5 h-5 text-gray-400" />
                  </div>
                  <span className="text-sm text-gray-500">Specifications</span>
                </div>
                
                {/* Connector */}
                <div className="w-20 h-1 bg-gray-200 mx-4"></div>
                
                {/* Step 3 */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                    <span className="text-gray-400">📋</span>
                  </div>
                  <span className="text-sm text-gray-500">Requirements</span>
                </div>
                
                {/* Connector */}
                <div className="w-20 h-1 bg-gray-200 mx-4"></div>
                
                {/* Step 4 */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                    <span className="text-gray-400">✏️</span>
                  </div>
                  <span className="text-sm text-gray-500">Generate</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '25%' }}></div>
              </div>
              <p className="text-center text-sm text-blue-600 font-medium mt-2">25% Complete</p>
            </div>
          </div>

          {/* Form Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Product Type Selection</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Product Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Category</label>
                <Select value={formData.productCategory} onValueChange={(value) => setFormData({...formData, productCategory: value})}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skincare-cosmetics">Skincare & Cosmetics</SelectItem>
                    <SelectItem value="haircare">Haircare</SelectItem>
                    <SelectItem value="oral-care">Oral Care</SelectItem>
                    <SelectItem value="body-care">Body Care</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                <Input 
                  placeholder="Enter product name..."
                  value={formData.productName}
                  onChange={(e) => setFormData({...formData, productName: e.target.value})}
                  className="w-full"
                />
              </div>
            </div>

            {/* Consistency Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-4">Consistency Type</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Cream */}
                <div 
                  className={`border-2 rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    formData.consistencyType === 'cream' 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFormData({...formData, consistencyType: 'cream'})}
                >
                  <div className="text-3xl mb-2">🧴</div>
                  <h4 className="font-semibold text-gray-900">Cream</h4>
                  <p className="text-xs text-gray-500">Thick, spreadable</p>
                </div>

                {/* Liquid/Serum */}
                <div 
                  className={`border-2 rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    formData.consistencyType === 'liquid' 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFormData({...formData, consistencyType: 'liquid'})}
                >
                  <div className="text-3xl mb-2">💧</div>
                  <h4 className="font-semibold text-gray-900">Liquid/Serum</h4>
                  <p className="text-xs text-gray-500">Flowing consistency</p>
                </div>

                {/* Gel */}
                <div 
                  className={`border-2 rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    formData.consistencyType === 'gel' 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFormData({...formData, consistencyType: 'gel'})}
                >
                  <div className="text-3xl mb-2">🌊</div>
                  <h4 className="font-semibold text-gray-900">Gel</h4>
                  <p className="text-xs text-gray-500">Semi-solid texture</p>
                </div>

                {/* Powder */}
                <div 
                  className={`border-2 rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    formData.consistencyType === 'powder' 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFormData({...formData, consistencyType: 'powder'})}
                >
                  <div className="text-3xl mb-2">⚪</div>
                  <h4 className="font-semibold text-gray-900">Powder/Foundation</h4>
                  <p className="text-xs text-gray-500">Dry, granular</p>
                </div>
              </div>
            </div>

            {/* Examples */}
            <div className="mb-8">
              <p className="text-sm text-gray-600 mb-3">
                <strong>Examples for skincare - cream:</strong>
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">Face cream</Badge>
                <Badge variant="outline" className="text-xs">Night cream</Badge>
                <Badge variant="outline" className="text-xs">Eye cream</Badge>
                <Badge variant="outline" className="text-xs">Body lotion</Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={handleBackToHome}
                className="text-gray-600 border-gray-300"
              >
                Back to Home
              </Button>
              <Button 
                onClick={handleNextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next Step
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
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