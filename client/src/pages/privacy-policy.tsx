import { Card, CardContent } from '@/components/ui/card'
import { Shield } from 'lucide-react'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-blue-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Privacy Policy
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8">
              <div className="prose prose-gray max-w-none">
                <p className="text-sm text-gray-500 mb-6">
                  <strong>Effective Date:</strong> January 15, 2025<br />
                  <strong>Last Updated:</strong> January 15, 2025
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Account Information</h3>
                <p className="mb-4">When you authenticate to download PDFs, we collect:</p>
                <ul className="list-disc pl-6 mb-6">
                  <li>Email address</li>
                  <li>Name (first and last name)</li>
                  <li>Profile image URL</li>
                  <li>Unique user identifier</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">Usage Information</h3>
                <p className="mb-4">We automatically collect information about how you use our service:</p>
                <ul className="list-disc pl-6 mb-6">
                  <li>Pages visited and time spent on each page</li>
                  <li>Formulations viewed and downloaded</li>
                  <li>AI formulator wizard usage and inputs</li>
                  <li>Search queries and browsing patterns</li>
                  <li>Device information and browser type</li>
                  <li>IP address and general location data</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">AI Interaction Data</h3>
                <p className="mb-4">When using our AI formulation wizard, we collect:</p>
                <ul className="list-disc pl-6 mb-6">
                  <li>Product specifications and requirements you input</li>
                  <li>Generated formulation results</li>
                  <li>User feedback and ratings on AI suggestions</li>
                  <li>Additional notes and customizations</li>
                </ul>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
                <p className="mb-4">We use collected information to:</p>
                <ul className="list-disc pl-6 mb-6">
                  <li><strong>Provide Services:</strong> Deliver AI formulation recommendations and access to our database</li>
                  <li><strong>Improve AI Performance:</strong> Train and enhance our AI models for better formulation accuracy</li>
                  <li><strong>Personalization:</strong> Provide personalized recommendations based on your usage history</li>
                  <li><strong>Analytics:</strong> Understand usage patterns and improve our service</li>
                  <li><strong>Communication:</strong> Send service updates, technical support, and important notices</li>
                  <li><strong>Compliance:</strong> Meet legal requirements and protect against misuse</li>
                </ul>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Information Sharing</h2>
                <p className="mb-4">We do not sell your personal information. We may share information in these limited circumstances:</p>
                <ul className="list-disc pl-6 mb-6">
                  <li><strong>Service Providers:</strong> Third-party services that help us operate (hosting, analytics, authentication)</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
                  <li><strong>Business Transfer:</strong> In connection with a merger, sale, or transfer of business assets</li>
                  <li><strong>Consent:</strong> When you explicitly authorize sharing</li>
                </ul>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. AI and Machine Learning</h2>
                <p className="mb-6">
                  Our AI systems learn from user interactions to improve formulation accuracy. Your usage data helps us:
                </p>
                <ul className="list-disc pl-6 mb-6">
                  <li>Refine AI algorithms for better recommendations</li>
                  <li>Identify popular formulation trends and requirements</li>
                  <li>Enhance safety and compliance checking</li>
                  <li>Develop new features and capabilities</li>
                </ul>
                <p className="mb-6">
                  All AI training data is anonymized and aggregated to protect individual privacy.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
                <p className="mb-6">
                  We implement appropriate security measures to protect your information:
                </p>
                <ul className="list-disc pl-6 mb-6">
                  <li>Encrypted data transmission (HTTPS/TLS)</li>
                  <li>Secure database storage with access controls</li>
                  <li>Regular security audits and updates</li>
                  <li>Limited employee access on a need-to-know basis</li>
                  <li>Session management and authentication security</li>
                </ul>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
                <p className="mb-6">
                  We retain your information as long as necessary to provide services and comply with legal obligations:
                </p>
                <ul className="list-disc pl-6 mb-6">
                  <li><strong>Account Data:</strong> Retained while your account is active</li>
                  <li><strong>Usage Analytics:</strong> Aggregated data may be retained indefinitely</li>
                  <li><strong>AI Training Data:</strong> Anonymized data used for ongoing AI improvement</li>
                  <li><strong>Legal Compliance:</strong> Some data may be retained longer as required by law</li>
                </ul>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Privacy Rights</h2>
                <p className="mb-4">Depending on your location, you may have rights regarding your personal information:</p>
                <ul className="list-disc pl-6 mb-6">
                  <li><strong>Access:</strong> Request a copy of your personal information</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                  <li><strong>Portability:</strong> Receive your data in a portable format</li>
                  <li><strong>Opt-out:</strong> Decline certain data processing activities</li>
                </ul>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Cookies and Tracking</h2>
                <p className="mb-6">
                  We use cookies and similar technologies to:
                </p>
                <ul className="list-disc pl-6 mb-6">
                  <li>Remember your preferences and settings</li>
                  <li>Analyze website traffic and usage patterns</li>
                  <li>Provide personalized content and recommendations</li>
                  <li>Maintain authentication sessions</li>
                </ul>
                <p className="mb-6">
                  You can control cookies through your browser settings.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. International Data Transfers</h2>
                <p className="mb-6">
                  Your information may be processed and stored in the United States or other countries where we operate. 
                  We ensure appropriate safeguards are in place for international transfers.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Children's Privacy</h2>
                <p className="mb-6">
                  Our service is not intended for children under 18. We do not knowingly collect personal information 
                  from children. If we become aware of such collection, we will take steps to delete the information.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to Privacy Policy</h2>
                <p className="mb-6">
                  We may update this privacy policy periodically. We will notify users of significant changes via 
                  email or website notice. Continued use of our service after changes constitutes acceptance.
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
                <p className="mb-4">
                  For privacy-related questions or requests, contact us:
                </p>
                <ul className="list-none mb-6">
                  <li><strong>Privacy Email:</strong> privacy@aiformulator.net</li>
                  <li><strong>General Contact:</strong> support@aiformulator.net</li>
                </ul>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
                  <p className="text-sm text-blue-800">
                    <strong>Your Privacy Matters:</strong> We are committed to protecting your privacy and being 
                    transparent about our data practices. If you have any concerns or questions, please don't 
                    hesitate to contact us.
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