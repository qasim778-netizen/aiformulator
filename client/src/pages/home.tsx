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
    consistencyType: "cream",
    targetViscosity: "medium",
    specialProperties: [],
    phLevel: "",
    shelfLife: "12-months",
    storageTemperature: "room-temperature",
    budgetCategory: "mid-range",
    productionVolume: "small-batch"
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
      consistencyType: "cream",
      targetViscosity: "medium",
      specialProperties: [],
      phLevel: "",
      shelfLife: "12-months",
      storageTemperature: "room-temperature",
      budgetCategory: "mid-range",
      productionVolume: "small-batch"
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
              <p className="text-blue-600 text-sm">⭕ Step {currentStep} of 4</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center">
                {/* Step 1 */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    currentStep >= 1 ? 'bg-blue-600' : 'bg-gray-200'
                  }`}>
                    <Check className={`w-5 h-5 ${currentStep >= 1 ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <span className={`text-sm ${currentStep >= 1 ? 'font-medium text-gray-900' : 'text-gray-500'}`}>Product Type</span>
                </div>
                
                {/* Connector */}
                <div className={`w-20 h-1 mx-4 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                
                {/* Step 2 */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'
                  }`}>
                    <Check className={`w-5 h-5 ${currentStep >= 2 ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <span className={`text-sm ${currentStep >= 2 ? 'font-medium text-gray-900' : 'text-gray-500'}`}>Specifications</span>
                </div>
                
                {/* Connector */}
                <div className={`w-20 h-1 mx-4 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                
                {/* Step 3 */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'
                  }`}>
                    <Check className={`w-5 h-5 ${currentStep >= 3 ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <span className={`text-sm ${currentStep >= 3 ? 'font-medium text-gray-900' : 'text-gray-500'}`}>Requirements</span>
                </div>
                
                {/* Connector */}
                <div className={`w-20 h-1 mx-4 ${currentStep >= 4 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                
                {/* Step 4 */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    currentStep >= 4 ? 'bg-blue-600' : 'bg-gray-200'
                  }`}>
                    <Check className={`w-5 h-5 ${currentStep >= 4 ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <span className={`text-sm ${currentStep >= 4 ? 'font-medium text-gray-900' : 'text-gray-500'}`}>Generate</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${currentStep * 25}%` }}></div>
              </div>
              <p className="text-center text-sm text-blue-600 font-medium mt-2">{currentStep * 25}% Complete</p>
            </div>
          </div>

          {/* Form Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            {currentStep === 1 && (
              <>
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
              </>
            )}

            {currentStep === 2 && (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Technical Specifications</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Target Viscosity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">Target Viscosity</label>
                    <div className="space-y-3">
                      {/* Low Viscosity */}
                      <div 
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                          formData.targetViscosity === 'low' 
                            ? 'border-blue-600 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setFormData({...formData, targetViscosity: 'low'})}
                      >
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-400 rounded-full mr-3"></div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">Low Viscosity</h4>
                            <p className="text-xs text-gray-500">Water-like consistency</p>
                            <p className="text-xs text-gray-500">Examples: Serums, toners, mists</p>
                          </div>
                          <input 
                            type="radio" 
                            checked={formData.targetViscosity === 'low'} 
                            readOnly
                            className="ml-auto"
                          />
                        </div>
                      </div>

                      {/* Medium Viscosity */}
                      <div 
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                          formData.targetViscosity === 'medium' 
                            ? 'border-blue-600 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setFormData({...formData, targetViscosity: 'medium'})}
                      >
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-600 rounded-full mr-3"></div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">Medium Viscosity</h4>
                            <p className="text-xs text-gray-500">Honey-like consistency</p>
                            <p className="text-xs text-gray-500">Examples: Lotions, gels, light creams</p>
                          </div>
                          <input 
                            type="radio" 
                            checked={formData.targetViscosity === 'medium'} 
                            readOnly
                            className="ml-auto"
                          />
                        </div>
                      </div>

                      {/* High Viscosity */}
                      <div 
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                          formData.targetViscosity === 'high' 
                            ? 'border-blue-600 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setFormData({...formData, targetViscosity: 'high'})}
                      >
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-gray-800 rounded-full mr-3"></div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">High Viscosity</h4>
                            <p className="text-xs text-gray-500">Thick paste consistency</p>
                            <p className="text-xs text-gray-500">Examples: Heavy creams, balms, ointments</p>
                          </div>
                          <input 
                            type="radio" 
                            checked={formData.targetViscosity === 'high'} 
                            readOnly
                            className="ml-auto"
                          />
                        </div>
                      </div>

                      {/* Custom Specification */}
                      <div 
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                          formData.targetViscosity === 'custom' 
                            ? 'border-blue-600 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setFormData({...formData, targetViscosity: 'custom'})}
                      >
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-purple-600 rounded-full mr-3"></div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">Custom Specification</h4>
                            <p className="text-xs text-gray-500">Define your own viscosity</p>
                            <p className="text-xs text-gray-500">Examples: Specialized formulations</p>
                          </div>
                          <input 
                            type="radio" 
                            checked={formData.targetViscosity === 'custom'} 
                            readOnly
                            className="ml-auto"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Special Properties */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Special Properties (skincare - cream)
                    </label>
                    <div className="space-y-3">
                      {[
                        'Anti-aging', 'Moisturizing', 'UV Protection', 'Anti-inflammatory',
                        'Brightening', 'Firming', 'Hypoallergenic', 'Fragrance-free',
                        'Paraben-free', 'Organic certified'
                      ].map((property) => (
                        <label key={property} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.specialProperties.includes(property)}
                            onChange={(e) => {
                              const newProperties = e.target.checked
                                ? [...formData.specialProperties, property]
                                : formData.specialProperties.filter((p) => p !== property);
                              setFormData({...formData, specialProperties: newProperties});
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-900">{property}</span>
                        </label>
                      ))}
                    </div>

                    {/* pH Level */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">pH Level</label>
                      <Input 
                        placeholder="e.g., 5.5-6.5"
                        value={formData.phLevel}
                        onChange={(e) => setFormData({...formData, phLevel: e.target.value})}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between mt-8">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="text-gray-600 border-gray-300"
                  >
                    Previous Step
                  </Button>
                  <Button 
                    onClick={handleNextStep}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Next Step
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {currentStep === 3 && (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Requirements & Specifications</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Shelf Life & Storage */}
                  <div className="space-y-6">
                    {/* Shelf Life */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">Shelf Life</label>
                      <div className="space-y-3">
                        {[
                          { value: '6-months', label: '6 Months', desc: 'Short-term natural products' },
                          { value: '12-months', label: '12 Months', desc: 'Standard cosmetic products' },
                          { value: '18-months', label: '18 Months', desc: 'Extended shelf life products' },
                          { value: '24-months', label: '24+ Months', desc: 'Long-term stable formulations' }
                        ].map((option) => (
                          <div
                            key={option.value}
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                              formData.shelfLife === option.value
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setFormData({...formData, shelfLife: option.value})}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-gray-900">{option.label}</h4>
                                <p className="text-xs text-gray-500">{option.desc}</p>
                              </div>
                              <input
                                type="radio"
                                checked={formData.shelfLife === option.value}
                                readOnly
                                className="w-4 h-4"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Storage Temperature */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">Storage Temperature</label>
                      <div className="space-y-3">
                        {[
                          { value: 'room-temperature', label: 'Room Temperature', desc: '15-25°C (59-77°F)' },
                          { value: 'cool-dry', label: 'Cool & Dry Place', desc: '10-20°C (50-68°F)' },
                          { value: 'refrigerated', label: 'Refrigerated', desc: '2-8°C (36-46°F)' },
                          { value: 'freezer', label: 'Freezer Storage', desc: 'Below 0°C (32°F)' }
                        ].map((option) => (
                          <div
                            key={option.value}
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                              formData.storageTemperature === option.value
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setFormData({...formData, storageTemperature: option.value})}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-gray-900">{option.label}</h4>
                                <p className="text-xs text-gray-500">{option.desc}</p>
                              </div>
                              <input
                                type="radio"
                                checked={formData.storageTemperature === option.value}
                                readOnly
                                className="w-4 h-4"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Budget & Production */}
                  <div className="space-y-6">
                    {/* Budget Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">Budget Category</label>
                      <div className="space-y-3">
                        {[
                          { value: 'budget', label: 'Budget-Friendly', desc: 'Cost-effective formulations', color: 'bg-green-100 text-green-800' },
                          { value: 'mid-range', label: 'Mid-Range', desc: 'Balanced quality and cost', color: 'bg-blue-100 text-blue-800' },
                          { value: 'premium', label: 'Premium', desc: 'High-quality ingredients', color: 'bg-purple-100 text-purple-800' },
                          { value: 'luxury', label: 'Luxury', desc: 'Exclusive premium formulation', color: 'bg-yellow-100 text-yellow-800' }
                        ].map((option) => (
                          <div
                            key={option.value}
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                              formData.budgetCategory === option.value
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setFormData({...formData, budgetCategory: option.value})}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <h4 className="font-semibold text-gray-900">{option.label}</h4>
                                  <Badge className={`${option.color} text-xs`}>
                                    {option.value === 'budget' ? '$' : 
                                     option.value === 'mid-range' ? '$$' :
                                     option.value === 'premium' ? '$$$' : '$$$$'}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-500">{option.desc}</p>
                              </div>
                              <input
                                type="radio"
                                checked={formData.budgetCategory === option.value}
                                readOnly
                                className="w-4 h-4"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Production Volume */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">Production Volume</label>
                      <div className="space-y-3">
                        {[
                          { value: 'small-batch', label: 'Small Batch', desc: '1-100 units', icon: '🧪' },
                          { value: 'medium-batch', label: 'Medium Batch', desc: '100-1,000 units', icon: '⚗️' },
                          { value: 'large-batch', label: 'Large Batch', desc: '1,000-10,000 units', icon: '🏭' },
                          { value: 'commercial', label: 'Commercial Scale', desc: '10,000+ units', icon: '🏢' }
                        ].map((option) => (
                          <div
                            key={option.value}
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                              formData.productionVolume === option.value
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setFormData({...formData, productionVolume: option.value})}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{option.icon}</span>
                                <div>
                                  <h4 className="font-semibold text-gray-900">{option.label}</h4>
                                  <p className="text-xs text-gray-500">{option.desc}</p>
                                </div>
                              </div>
                              <input
                                type="radio"
                                checked={formData.productionVolume === option.value}
                                readOnly
                                className="w-4 h-4"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between mt-8">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="text-gray-600 border-gray-300"
                  >
                    Previous Step
                  </Button>
                  <Button 
                    onClick={handleNextStep}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Next Step
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
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