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
      {/* Header Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <Beaker className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-xl font-bold text-primary">ChemFormula Pro</h1>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-primary font-medium">Dashboard</Link>
              <Link href="/browse" className="text-gray-700 hover:text-primary font-medium">Formula Database</Link>
              <span className="text-gray-700 hover:text-primary font-medium cursor-pointer">About</span>
              <span className="text-gray-700 hover:text-primary font-medium cursor-pointer">Contact</span>
            </nav>

            {/* Search and Admin */}
            <div className="flex items-center space-x-4">
              <div className="relative hidden sm:block">
                <input
                  type="text"
                  placeholder="Search formulations or categories..."
                  className="w-64 px-4 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <Link href="/admin">
                <Button 
                  className="bg-primary hover:bg-primary/90 text-white px-4 py-2"
                  data-testid="button-admin"
                >
                  Admin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-6 w-full max-w-none">
        {/* Hero Section - Hidden when in wizard */}
        <div className="text-center mb-8"></div>

        {/* Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-6xl mx-auto">
          {!isWizardActive && (
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="formulator" className="flex items-center gap-2 text-lg py-3" data-testid="tab-formulator">
                <Sparkles className="h-5 w-5" />
                Create Custom Formula
              </TabsTrigger>
              <TabsTrigger value="browse" className="flex items-center gap-2 text-lg py-3" data-testid="tab-browse">
                <BookOpen className="h-5 w-5" />
                Ready-Made Formulas
              </TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="formulator" className={isWizardActive ? "mt-0" : "mt-8"}>
            <AIFormulatorWizard onWizardStateChange={setIsWizardActive} />
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