import { Link } from 'wouter'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Beaker, BookOpen, Sparkles } from 'lucide-react'
import AIFormulatorWizard from '@/components/ai-formulator-wizard'

export default function Home() {
  const [activeTab, setActiveTab] = useState("formulator")

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-blue-50 to-white overflow-x-hidden">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-6 max-w-full">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-inter font-bold text-gray-900 mb-4">
            ChemFormula<span className="text-primary">Pro</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
            Professional Chemical Formulations for Small Business Manufacturers
          </p>
        </div>

        {/* Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="formulator" className="flex items-center gap-2 text-lg py-3" data-testid="tab-formulator">
              <Sparkles className="h-5 w-5" />
              AI Formulator
            </TabsTrigger>
            <TabsTrigger value="browse" className="flex items-center gap-2 text-lg py-3" data-testid="tab-browse">
              <BookOpen className="h-5 w-5" />
              Browse Library
            </TabsTrigger>
          </TabsList>

          <TabsContent value="formulator" className="mt-8">
            <AIFormulatorWizard />
          </TabsContent>

          <TabsContent value="browse" className="mt-8">
            <Card className="max-w-4xl mx-auto shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="flex items-center justify-center mb-6">
                  <BookOpen className="h-12 w-12 text-primary mr-4" />
                  <h2 className="text-3xl font-bold text-gray-900">Formulation Library</h2>
                </div>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  Access 68+ ready-to-use professional formulations across 10 product categories. 
                  Create high-quality chemical products with tested recipes and detailed specifications.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="bg-primary/10 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-3">
                      <Beaker className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">68+ Formulations</h3>
                    <p className="text-sm text-gray-600">Professional tested recipes</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-primary/10 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-3">
                      <BookOpen className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">10 Categories</h3>
                    <p className="text-sm text-gray-600">Diverse product types</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-primary/10 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Commercial Ready</h3>
                    <p className="text-sm text-gray-600">Detailed specifications</p>
                  </div>
                </div>
                <Link href="/browse">
                  <Button 
                    size="lg" 
                    className="bg-primary text-white hover:bg-primary/90 px-8 py-4 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                    data-testid="button-browse-formulations"
                  >
                    <BookOpen className="h-5 w-5 mr-3" />
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