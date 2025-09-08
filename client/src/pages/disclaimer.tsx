import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-blue-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Disclaimer of Use
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Important disclaimers regarding the use of AI Formulator and chemical formulations.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
                <div className="flex items-start">
                  <AlertTriangle className="h-6 w-6 text-red-600 mr-3 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Critical Safety Notice</h3>
                    <p className="text-red-700 text-sm">
                      Chemical formulations can be dangerous if improperly handled or prepared. Always consult with 
                      qualified professionals, conduct proper testing, and follow all safety protocols before 
                      manufacturing any products.
                    </p>
                  </div>
                </div>
              </div>

              <div className="prose prose-gray max-w-none">
                <p className="text-sm text-gray-500 mb-6">
                  <strong>Effective Date:</strong> January 15, 2025<br />
                  <strong>Last Updated:</strong> January 15, 2025
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. General Disclaimer</h2>
                <p className="mb-6">
                  The information provided by AI Formulator is for educational and informational purposes only. 
                  While we strive to provide accurate and up-to-date information, we make no representations or 
                  warranties of any kind, express or implied, about the completeness, accuracy, reliability, 
                  suitability, or availability of the formulations or related information.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. AI-Generated Content Limitations</h2>
                <p className="mb-6">
                  <strong>Important:</strong> Our AI system generates formulations based on data analysis and machine learning. 
                  Users must understand that:
                </p>
                <ul className="list-disc pl-6 mb-6">
                  <li>AI-generated formulations are suggestions, not guaranteed solutions</li>
                  <li>Algorithms may produce errors, inconsistencies, or inappropriate recommendations</li>
                  <li>AI cannot account for all variables in real-world manufacturing conditions</li>
                  <li>Generated formulations require human expertise for validation and safety assessment</li>
                  <li>AI recommendations should never replace professional chemical engineering consultation</li>
                </ul>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Safety and Testing Requirements</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-yellow-800 font-semibold mb-2">Mandatory Safety Protocols:</p>
                  <ul className="list-disc pl-6 text-yellow-700">
                    <li>Conduct comprehensive safety testing before any use</li>
                    <li>Verify chemical compatibility and stability</li>
                    <li>Test for skin sensitivity and toxicity (where applicable)</li>
                    <li>Ensure proper ventilation and safety equipment during preparation</li>
                    <li>Follow all Material Safety Data Sheet (MSDS) guidelines for ingredients</li>
                  </ul>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Regulatory Compliance</h2>
                <p className="mb-6">
                  <strong>You are solely responsible for ensuring compliance with all applicable regulations:</strong>
                </p>
                <ul className="list-disc pl-6 mb-6">
                  <li>FDA regulations for cosmetics, personal care products, and drugs</li>
                  <li>EPA requirements for cleaning products and industrial chemicals</li>
                  <li>OSHA workplace safety standards</li>
                  <li>Local and state manufacturing regulations</li>
                  <li>International standards for exported products</li>
                  <li>Product registration and notification requirements</li>
                </ul>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Professional Consultation Required</h2>
                <p className="mb-6">
                  AI Formulator is not a substitute for professional advice. You must consult with qualified professionals including:
                </p>
                <ul className="list-disc pl-6 mb-6">
                  <li><strong>Chemical Engineers:</strong> For formulation validation and optimization</li>
                  <li><strong>Regulatory Experts:</strong> For compliance and approval processes</li>
                  <li><strong>Safety Specialists:</strong> For risk assessment and safety protocols</li>
                  <li><strong>Quality Control Professionals:</strong> For testing and quality assurance</li>
                  <li><strong>Legal Counsel:</strong> For liability and regulatory matters</li>
                </ul>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. No Warranty or Guarantee</h2>
                <p className="mb-6">
                  AI Formulator provides all content "as is" without warranty of any kind. We specifically disclaim:
                </p>
                <ul className="list-disc pl-6 mb-6">
                  <li>Fitness for any particular purpose or use</li>
                  <li>Accuracy or completeness of formulations</li>
                  <li>Safety or efficacy of suggested formulations</li>
                  <li>Compliance with regulatory requirements</li>
                  <li>Absence of errors, bugs, or system failures</li>
                  <li>Uninterrupted or secure access to services</li>
                </ul>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitation of Liability</h2>
                <p className="mb-6">
                  <strong>AI Formulator, its owners, operators, and affiliates shall not be liable for any damages including:</strong>
                </p>
                <ul className="list-disc pl-6 mb-6">
                  <li>Personal injury, death, or property damage</li>
                  <li>Product failures, defects, or recalls</li>
                  <li>Regulatory violations, fines, or legal action</li>
                  <li>Business losses, lost profits, or commercial damages</li>
                  <li>Consequential, indirect, or punitive damages</li>
                  <li>Environmental damage or contamination</li>
                </ul>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. User Assumption of Risk</h2>
                <p className="mb-6">
                  By using AI Formulator, you acknowledge and accept that:
                </p>
                <ul className="list-disc pl-6 mb-6">
                  <li>Chemical manufacturing involves inherent risks</li>
                  <li>You assume full responsibility for all consequences of use</li>
                  <li>You will implement appropriate safety measures</li>
                  <li>You will obtain necessary insurance coverage</li>
                  <li>You will not hold AI Formulator liable for any outcomes</li>
                </ul>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Intellectual Property Notice</h2>
                <p className="mb-6">
                  While formulations may be used commercially, users should:
                </p>
                <ul className="list-disc pl-6 mb-6">
                  <li>Verify that formulations don't infringe existing patents</li>
                  <li>Conduct independent patent searches when appropriate</li>
                  <li>Understand that some ingredients may be proprietary or restricted</li>
                  <li>Respect trademark and trade secret rights of others</li>
                </ul>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Environmental Considerations</h2>
                <p className="mb-6">
                  Users must consider environmental impact and:
                </p>
                <ul className="list-disc pl-6 mb-6">
                  <li>Ensure proper waste disposal and treatment</li>
                  <li>Comply with environmental protection regulations</li>
                  <li>Consider sustainability and biodegradability</li>
                  <li>Implement appropriate containment measures</li>
                </ul>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Service Modifications</h2>
                <p className="mb-6">
                  AI Formulator reserves the right to modify, update, or discontinue services without notice. 
                  Users should not rely solely on our platform for critical business operations.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact for Legal Matters</h2>
                <p className="mb-4">
                  For legal inquiries or concerns about this disclaimer:
                </p>
                <ul className="list-none mb-6">
                  <li><strong>Legal Email:</strong> legal@aiformulator.com</li>
                </ul>

                <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-8">
                  <h3 className="text-lg font-semibold text-red-800 mb-3">Final Warning</h3>
                  <p className="text-red-700">
                    <strong>Chemical formulation and manufacturing can be extremely dangerous.</strong> Improper handling 
                    can result in serious injury, death, property damage, or environmental harm. Never attempt to 
                    manufacture chemical products without proper training, equipment, and professional oversight. 
                    By using this service, you acknowledge these risks and agree to proceed only with appropriate 
                    caution and expertise.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}