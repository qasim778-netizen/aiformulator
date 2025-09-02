import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'
import AIFormulatorWizard from '@/components/ai-formulator-wizard'

export default function Home() {
  const [isWizardActive, setIsWizardActive] = useState(false)


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-blue-50 to-white overflow-x-hidden w-full">
      <div className="responsive-container mx-auto py-4 sm:py-6 lg:py-8 w-full max-w-7xl">
        {/* Hero Section - Hidden when in wizard */}
        <div className="text-center mb-4"></div>

        {/* Single Custom Formula Option */}
        <div className="w-full max-w-6xl mx-auto">
          {!isWizardActive && (
            <div className="flex justify-center mb-4 sm:mb-6">
              <Card className="max-w-md w-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] touch-target ring-2 ring-primary bg-primary/5 border-primary">
                <CardContent className="p-4 sm:p-5 lg:p-6 text-center">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white p-4 rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <h3 className="text-responsive-xl font-bold text-gray-900 mb-2">Create Custom Formula</h3>
                  <p className="text-gray-600 text-responsive-sm">AI-powered formulation wizard with precise specifications</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className={isWizardActive ? "mt-0" : "mt-8"}>
            <AIFormulatorWizard onWizardStateChange={setIsWizardActive} />
          </div>

        </div>
      </div>
    </div>
  )
}