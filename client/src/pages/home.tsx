import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'
import AIFormulatorWizard from '@/components/ai-formulator-wizard'
import HowItWorks from '@/components/how-it-works'
import WhyChooseFormulator from '@/components/why-choose-formulator'
import SampleFormulations from '@/components/sample-formulations'
import { GlobalReachSection } from '@/components/global-reach'
import FAQ from '@/components/faq'

export default function Home() {
  const [isWizardActive, setIsWizardActive] = useState(false)

  useEffect(() => {
    document.title = "AI Formulation Generator | Online Chemical Formulation Software"
    
    // Set unique meta description for home page
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'AI-powered chemical formulation platform for professional and industrial use. Create custom formulations or browse our library of professional formulas.');
    }
    
    // Add Organization and Website JSON-LD structured data
    const existingSchema = document.getElementById('organization-schema');
    if (!existingSchema) {
      const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "AIFormulator",
        "url": "https://aiformulator.net",
        "logo": "https://aiformulator.net/logo.png",
        "description": "AI-powered chemical formulation platform for professional and industrial use",
        "sameAs": [
          "https://www.youtube.com/@AiFormulator",
          "https://www.instagram.com/aiformulator/",
          "https://www.facebook.com/aiformulator"
        ]
      };
      
      const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "AIFormulator",
        "url": "https://aiformulator.net"
      };
      
      const script = document.createElement('script');
      script.id = 'organization-schema';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify([organizationSchema, websiteSchema]);
      document.head.appendChild(script);
    }
    
    return () => {
      const script = document.getElementById('organization-schema');
      if (script) {
        script.remove();
      }
    };
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-blue-50 to-white overflow-x-hidden w-full">
      <div className="responsive-container mx-auto py-4 sm:py-6 lg:py-8 w-full max-w-7xl">
        {/* Hero Section */}
        {!isWizardActive && (
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
              AI Formulation Generator – Professional Chemical Formulation Software Online
            </h1>
            <h2 className="text-xl sm:text-2xl text-gray-600 mb-2">
              AI-Powered Formulation Solutions for Small Business
            </h2>
            <p className="text-base sm:text-lg text-gray-500 max-w-3xl mx-auto">
              Create custom chemical formulations instantly with our AI wizard or browse our extensive library of professional formulas
            </p>
          </div>
        )}

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

        {/* How It Works Section */}
        {!isWizardActive && (
          <div className="mt-12 sm:mt-16 lg:mt-20 bg-[#F8FBFF] rounded-2xl">
            <HowItWorks />
          </div>
        )}

        {/* Why Choose AIFormulator Section */}
        {!isWizardActive && (
          <div className="mt-12 sm:mt-16 lg:mt-20">
            <WhyChooseFormulator />
          </div>
        )}

        {/* Sample Formulations Section */}
        {!isWizardActive && (
          <div className="mt-12 sm:mt-16 lg:mt-20">
            <SampleFormulations />
          </div>
        )}

        {/* Global Reach Section */}
        {!isWizardActive && (
          <div className="mt-12 sm:mt-16 lg:mt-20">
            <GlobalReachSection />
          </div>
        )}

        {/* FAQ Section */}
        {!isWizardActive && (
          <div className="mt-12 sm:mt-16 lg:mt-20">
            <FAQ />
          </div>
        )}
      </div>
    </div>
  )
}