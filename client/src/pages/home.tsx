import { Link } from 'wouter'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Beaker, BookOpen, Sparkles } from 'lucide-react'
import AIFormulatorWizard from '@/components/ai-formulator-wizard'

export default function Home() {
  const [activeTab, setActiveTab] = useState("formulator")
  const [isWizardActive, setIsWizardActive] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-blue-50 to-white overflow-x-hidden w-full">
      <div className="responsive-container mx-auto py-4 sm:py-6 lg:py-8 w-full max-w-7xl">
        {/* Hero Section - Hidden when in wizard */}
        <div className="text-center mb-4"></div>

        {/* Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-6xl mx-auto">
          {!isWizardActive && (
            <div className="responsive-grid gap-4 sm:gap-6 mb-4 sm:mb-6">
              <Card 
                className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] touch-target ${
                  activeTab === 'formulator' 
                    ? 'ring-2 ring-primary bg-primary/5 border-primary' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setActiveTab('formulator')}
                data-testid="tab-formulator"
              >
                <CardContent className="p-4 sm:p-5 lg:p-6 text-center">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white p-4 rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <h3 className="text-responsive-xl font-bold text-gray-900 mb-2">Create Custom Formula</h3>
                  <p className="text-gray-600 text-responsive-sm">AI-powered formulation wizard with precise specifications</p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] touch-target ${
                  activeTab === 'browse' 
                    ? 'ring-2 ring-primary bg-primary/5 border-primary' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setActiveTab('browse')}
                data-testid="tab-browse"
              >
                <CardContent className="p-4 sm:p-5 lg:p-6 text-center">
                  <div className="bg-gradient-to-br from-blue-500 to-teal-500 text-white p-4 rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <h3 className="text-responsive-xl font-bold text-gray-900 mb-2">Ready-Made Formulas</h3>
                  <p className="text-gray-600 text-responsive-sm">78+ professional formulations across 12 categories</p>
                </CardContent>
              </Card>
            </div>
          )}

          <TabsContent value="formulator" className={isWizardActive ? "mt-0" : "mt-8"}>
            <AIFormulatorWizard onWizardStateChange={setIsWizardActive} />
          </TabsContent>

          <TabsContent value="browse" className="mt-4">
            <Card className="max-w-4xl mx-auto shadow-lg">
              <CardContent className="p-4 sm:p-6 lg:p-8 text-center">
                <div className="flex flex-col sm:flex-row items-center justify-center mb-4 sm:mb-6">
                  <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-primary mb-2 sm:mb-0 sm:mr-4" />
                  <h2 className="text-responsive-2xl font-bold text-gray-900">Formulation Library</h2>
                </div>
                <p className="text-responsive-base text-gray-600 mb-4 sm:mb-6 max-w-2xl mx-auto">
                  Access 78+ ready-to-use professional formulations across 12 product categories. 
                  Create high-quality chemical products with tested recipes and detailed specifications.
                </p>
                <div className="responsive-grid gap-4 sm:gap-6 mb-4 sm:mb-6">
                  <div className="text-center">
                    <div className="bg-primary/10 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-3">
                      <Beaker className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-responsive-base">78+ Formulations</h3>
                    <p className="text-responsive-sm text-gray-600">Professional tested recipes</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-primary/10 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-3">
                      <BookOpen className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-responsive-base">12 Categories</h3>
                    <p className="text-responsive-sm text-gray-600">Diverse product types</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-primary/10 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-responsive-base">Commercial Ready</h3>
                    <p className="text-responsive-sm text-gray-600">Detailed specifications</p>
                  </div>
                </div>
                <Link href="/browse">
                  <Button 
                    size="lg" 
                    className="bg-primary text-white hover:bg-primary/90 px-6 sm:px-8 py-3 sm:py-4 text-responsive-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 touch-target"
                    data-testid="button-browse-formulations"
                  >
                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                    Browse Formulations
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}