import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, Crown, Building2, Store, Factory, FlaskConical, Rocket } from 'lucide-react'
import AIFormulatorWizard, { type AIFormulatorWizardHandle } from '@/components/ai-formulator-wizard'
import HowItWorks from '@/components/how-it-works'
import WhyChooseFormulator from '@/components/why-choose-formulator'
import SampleFormulations from '@/components/sample-formulations'
import { GlobalReachSection } from '@/components/global-reach'
import FAQ from '@/components/faq'
import { FormulationSupportAll } from '@/components/formulation-support'

const whoCanUseItems = [
  { icon: Crown, title: "Brand Owners", desc: "Launching private-label products", color: "from-amber-100 to-yellow-50", iconColor: "text-amber-600" },
  { icon: Building2, title: "Professional Formulators", desc: "R&D specialists creating new formulations", color: "from-blue-100 to-indigo-50", iconColor: "text-blue-600" },
  { icon: Store, title: "Small Business Owners", desc: "Starting manufacturing operations", color: "from-emerald-100 to-teal-50", iconColor: "text-emerald-600" },
  { icon: Factory, title: "Contract Manufacturers", desc: "OEM/ODM chemical producers", color: "from-purple-100 to-violet-50", iconColor: "text-purple-600" },
  { icon: FlaskConical, title: "Chemical Traders", desc: "Raw material suppliers for formulation", color: "from-cyan-100 to-blue-50", iconColor: "text-cyan-600" },
  { icon: Rocket, title: "Startup Entrepreneurs", desc: "Entering the chemical industry", color: "from-pink-100 to-rose-50", iconColor: "text-pink-600" },
]

export default function Home() {
  const [isWizardActive, setIsWizardActive] = useState(false)
  const [showWizardSection, setShowWizardSection] = useState(false)
  const wizardRef = useRef<AIFormulatorWizardHandle>(null)

  // Scroll to #ai-formulator when the page loads with that hash in the URL
  // (and reveal the wizard section so the link still works for deep-links)
  useEffect(() => {
    if (window.location.hash === '#ai-formulator') {
      setShowWizardSection(true);
      const tryScroll = (attempts = 0) => {
        const el = document.getElementById('ai-formulator');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (attempts < 10) {
          setTimeout(() => tryScroll(attempts + 1), 100);
        }
      };
      setTimeout(() => tryScroll(), 150);
    }
  }, []);

  const revealAndScrollToWizard = () => {
    setShowWizardSection(true);
    setTimeout(() => {
      const el = document.getElementById('ai-formulator');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  useEffect(() => {
    document.title = "AI Formulation Generator | Online Chemical Formulation Software"
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'AI formulation generator for industrial and commercial products. Use our chemical formulation AI to create custom formulas instantly or browse 50+ professional product formulations with cost optimization and technical documentation.');
    }
    
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
    <div className="min-h-screen overflow-x-hidden w-full">
      {/* Hero Section - White */}
      <section className="bg-gradient-to-br from-primary/5 via-blue-50 to-white py-16 sm:py-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          {!isWizardActive && (
            <div className="text-center mb-10 sm:mb-12">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-5 leading-tight tracking-tight">
                AI Formulation Generator – Professional Chemical Formulation Software Online
              </h1>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-600 mb-3">
                AI-Powered Formulation Solutions for Small Business
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                AIFormulator is an advanced AI formulation generator built for manufacturers and small businesses. Our chemical formulation AI helps you create commercial-ready product formulas with accurate ingredient percentages, cost optimization, and professional documentation — all through a powerful online formulation tool.
              </p>
            </div>
          )}

          <div className="w-full max-w-6xl mx-auto">
            {!isWizardActive && (
              <div className="flex justify-center mb-4 sm:mb-6">
                <Card
                  className="max-w-md w-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] touch-target ring-2 ring-primary bg-primary/5 border-primary"
                  onClick={revealAndScrollToWizard}
                >
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

            {showWizardSection && (
              <div id="ai-formulator" className={isWizardActive ? "mt-0" : "mt-8"}>
                <AIFormulatorWizard ref={wizardRef} onWizardStateChange={setIsWizardActive} />
              </div>
            )}
          </div>
        </div>
      </section>

      {!isWizardActive && (
        <>
          {/* Divider */}
          <div className="border-t border-[#E5E7EB]" />

          {/* How It Works - Light Grey */}
          <section className="bg-[#F8F9FB] py-20">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
              <HowItWorks />
            </div>
          </section>

          {/* Divider */}
          <div className="border-t border-[#E5E7EB]" />

          {/* Why Choose - Soft Blue Gradient */}
          <section className="bg-gradient-to-br from-blue-50 via-indigo-50/30 to-white py-20">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
              <WhyChooseFormulator />
            </div>
          </section>

          {/* Divider */}
          <div className="border-t border-[#E5E7EB]" />

          {/* Sample Formulations - White */}
          <section className="bg-white py-20">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
              <SampleFormulations />
            </div>
          </section>

          {/* Divider */}
          <div className="border-t border-[#E5E7EB]" />

          {/* Formulation Support Rows */}
          <section className="bg-white py-20">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
              <FormulationSupportAll />
            </div>
          </section>

          {/* Divider */}
          <div className="border-t border-[#E5E7EB]" />

          {/* Who Can Use - Light Grey */}
          <section className="bg-[#F8F9FB] py-20">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
                  Who Can Use AF Formulation Software?
                </h2>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                  AF Formulation Software is designed for professionals and businesses who need structured, commercial-grade chemical formulations.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[30px] max-w-5xl mx-auto">
                {whoCanUseItems.map((item) => (
                  <Card key={item.title} className="bg-white border border-gray-100 hover:shadow-lg transition-all duration-300 text-center" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                    <CardContent className="p-8">
                      <div className={`bg-gradient-to-br ${item.color} w-[68px] h-[68px] rounded-full flex items-center justify-center mx-auto mb-5`}>
                        <item.icon className={`h-8 w-8 ${item.iconColor}`} />
                      </div>
                      <h3 className="font-bold text-gray-900 text-xl mb-2">{item.title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-center text-gray-500 mt-10 text-sm">
                Built for professionals who need commercial-grade formulations — not hobby recipes.
              </p>
            </div>
          </section>

          {/* Divider */}
          <div className="border-t border-[#E5E7EB]" />

          {/* Global Reach - Soft Gradient */}
          <section className="bg-gradient-to-br from-[#F7F5F2] via-[#F0EDE8] to-[#F7F5F2] py-20">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
              <GlobalReachSection />
            </div>
          </section>

          {/* Divider */}
          <div className="border-t border-[#E5E7EB]" />

          {/* FAQ - White */}
          <section className="bg-white py-20">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
              <FAQ />
            </div>
          </section>
        </>
      )}
    </div>
  )
}
