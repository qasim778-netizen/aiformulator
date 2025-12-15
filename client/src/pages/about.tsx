import { useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Beaker, Target, Users, Award, Lightbulb, Shield, Zap } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import type { Page } from '@shared/schema'

// Default static content fallback
const defaultContent = {
  title: "About AI Formulator",
  subtitle: "Revolutionizing Chemical Formulation for Small Business Success",
  description: "Empowering small business manufacturers with professional-grade chemical formulations and AI-powered formulation tools for creating high-quality products that compete with industry leaders."
};

export default function About() {
  useEffect(() => {
    document.title = "About AI Formulator | AI-Powered Chemical Formulation Platform"
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Learn about AIFormulator, an AI-powered platform helping manufacturers and entrepreneurs develop professional chemical formulations.');
    }
  }, [])

  // Try to load dynamic content from database
  const { data: pageData } = useQuery<Page>({
    queryKey: ['/api/pages/about'],
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Use dynamic content if available, otherwise fall back to static content
  const shouldUseDynamicContent = pageData && pageData.isActive;

  if (shouldUseDynamicContent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-blue-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {pageData.title}
              </h1>
              {pageData.metaDescription && (
                <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
                  {pageData.metaDescription}
                </p>
              )}
            </div>
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: pageData.content }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-blue-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {defaultContent.title}
          </h1>
          <h2 className="text-xl md:text-2xl font-semibold text-primary mb-4">
            {defaultContent.subtitle}
          </h2>
          <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
            {defaultContent.description}
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <Target className="h-10 w-10 text-primary mr-4" />
                <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                To democratize access to professional chemical formulations by empowering small 
                manufacturers with cutting-edge AI technology, comprehensive databases, and expert 
                knowledge. We bridge the gap between industrial-grade chemistry and accessible 
                business solutions.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <Lightbulb className="h-10 w-10 text-blue-500 mr-4" />
                <h2 className="text-2xl font-bold text-gray-900">Our Vision</h2>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                A world where innovative chemical formulations drive sustainable business growth. 
                We envision small businesses creating market-leading products through intelligent 
                formulation science, contributing to a safer and more sustainable future.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Core Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">What We Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-8 text-center">
                <Beaker className="h-16 w-16 text-primary mx-auto mb-6" />
                <h3 className="text-xl font-bold text-gray-900 mb-4">137+ Ready Formulations</h3>
                <p className="text-gray-600 leading-relaxed">
                  Professional-tested formulations across skincare, cosmetics, cleaning products, 
                  oral care, and specialized industrial applications.
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-8 text-center">
                <Zap className="h-16 w-16 text-primary mx-auto mb-6" />
                <h3 className="text-xl font-bold text-gray-900 mb-4">AI-Powered Innovation</h3>
                <p className="text-gray-600 leading-relaxed">
                  Advanced AI formulation engine with intelligent suggestions, cost optimization, 
                  and custom formulation generation based on your specifications.
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-8 text-center">
                <Shield className="h-16 w-16 text-primary mx-auto mb-6" />
                <h3 className="text-xl font-bold text-gray-900 mb-4">Professional Standards</h3>
                <p className="text-gray-600 leading-relaxed">
                  Lab-grade accuracy with comprehensive safety guidelines, regulatory compliance, 
                  and detailed manufacturing protocols for commercial production.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Why Choose AI Formulator</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">For Small Businesses</h3>
              <ul className="space-y-4 text-gray-600">
                <li className="flex items-start">
                  <Award className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <span>Access professional-grade formulations without expensive R&D costs</span>
                </li>
                <li className="flex items-start">
                  <Award className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <span>AI-powered optimization reduces material waste and production costs</span>
                </li>
                <li className="flex items-start">
                  <Award className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <span>Comprehensive safety and regulatory guidance for market compliance</span>
                </li>
                <li className="flex items-start">
                  <Award className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <span>Scale from small batches to commercial production seamlessly</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Our Technology Edge</h3>
              <ul className="space-y-4 text-gray-600">
                <li className="flex items-start">
                  <Beaker className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <span>Advanced AI algorithms trained on thousands of successful formulations</span>
                </li>
                <li className="flex items-start">
                  <Beaker className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <span>Real-time ingredient compatibility and stability analysis</span>
                </li>
                <li className="flex items-start">
                  <Beaker className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <span>Continuous database updates with latest industry innovations</span>
                </li>
                <li className="flex items-start">
                  <Beaker className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                  <span>Integration with supply chain data for optimal sourcing recommendations</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Our Commitment */}
        <Card className="bg-gradient-to-r from-primary/5 to-blue-100 border-none">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Commitment to Excellence</h2>
            <p className="text-lg text-gray-700 max-w-4xl mx-auto leading-relaxed mb-8">
              We're dedicated to providing accurate, safe, and commercially viable formulations 
              that drive small business success. Every formulation undergoes rigorous testing, 
              documentation, and validation to ensure reliability, safety, and compliance with 
              international industry standards.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">99.5%</div>
                <div className="text-sm text-gray-600">Formulation Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                <div className="text-sm text-gray-600">AI-Powered Support</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">100%</div>
                <div className="text-sm text-gray-600">Safety Compliance</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}