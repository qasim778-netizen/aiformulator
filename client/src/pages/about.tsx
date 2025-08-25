import { Card, CardContent } from '@/components/ui/card'
import { Beaker, Target, Users, Award } from 'lucide-react'

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-blue-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            About AI Formulator
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Empowering small business manufacturers with professional-grade chemical formulations 
            and AI-powered formulation tools for creating high-quality products.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center mb-4">
                <Target className="h-8 w-8 text-primary mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
              </div>
              <p className="text-gray-600">
                To democratize access to professional chemical formulations by providing small 
                manufacturers with the tools, knowledge, and resources they need to create 
                high-quality products that compete with industry leaders.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <div className="flex items-center mb-4">
                <Beaker className="h-8 w-8 text-primary mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Our Vision</h2>
              </div>
              <p className="text-gray-600">
                A world where innovative chemical formulations are accessible to everyone, 
                enabling small businesses to create products that improve lives while 
                maintaining the highest standards of quality and safety.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">What We Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="bg-primary/10 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Beaker className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">68+ Ready Formulations</h3>
                <p className="text-gray-600">
                  Professional-tested formulations across skincare, cleaning, oral care, and more.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="bg-primary/10 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Creation</h3>
                <p className="text-gray-600">
                  Advanced AI formulation wizard with precise specifications and cost optimization.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="bg-primary/10 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional Quality</h3>
                <p className="text-gray-600">
                  Lab-grade accuracy with detailed specifications and manufacturing protocols.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Team */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Commitment</h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            We're dedicated to providing accurate, safe, and commercially viable formulations 
            that help small businesses succeed. Every formulation is carefully tested and 
            documented to ensure reliability and compliance with industry standards.
          </p>
        </div>
      </div>
    </div>
  )
}