import { useState } from 'react'

interface FAQItem {
  question: string
  answer: string
}

export default function FAQ() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const faqs: FAQItem[] = [
    {
      question: 'What is AI Formulator?',
      answer: 'AI Formulator is an AI-powered platform that helps entrepreneurs and manufacturers create professional chemical formulations instantly. Whether you need cosmetics, detergents, adhesives, or other chemical products, our AI wizard generates precise, validated formulations with complete documentation.'
    },
    {
      question: 'Are the formulations safe and tested?',
      answer: 'Yes, all our formulations follow industry standards and safety guidelines. They are validated for pH ranges, viscosity targets, and ingredient compatibility. We recommend conducting your own testing before commercial production to ensure compliance with local regulations.'
    },
    {
      question: 'How does the AI formulation wizard work?',
      answer: 'Our AI wizard uses advanced machine learning to analyze your product requirements and generate optimized formulations. Simply provide details about your desired product, and the AI will suggest precise ingredient percentages, processing steps, and cost estimates within seconds.'
    },
    {
      question: 'Do I need authentication to use the service?',
      answer: 'Yes, you need to create an account and log in to use AI Formulator. This ensures your formulations are securely saved, and you can access your project history and versions anytime.'
    },
    {
      question: 'What categories of products do you cover?',
      answer: 'We cover 50+ product categories including cosmetics, detergents, adhesives, car care, baby care, pet care, cleaning products, leather treatments, and many more. New categories are added regularly based on user demand.'
    },
    {
      question: 'Can I modify existing formulations?',
      answer: 'Yes, you can easily modify any formulation. Edit ingredient percentages, add or remove components, adjust process steps, and regenerate cost estimates. All changes are tracked with version control.'
    },
    {
      question: 'What information is included in each formulation?',
      answer: 'Each formulation includes precise ingredient percentages, detailed process steps, mixing instructions, pH ranges, viscosity targets, safety notes, batch records, cost breakdown per litre, and production scalability guidelines.'
    },
    {
      question: 'How accurate are the cost estimations?',
      answer: 'Our cost estimates are based on current market ingredient prices. They provide reliable guidance for budgeting and pricing. Actual costs may vary based on supplier, quantity, and local market conditions.'
    },
    {
      question: 'Do you provide technical support?',
      answer: 'Yes, we offer technical support to help you understand formulations, optimize processes, and troubleshoot any issues. Contact our team for personalized assistance.'
    },
    {
      question: 'Can I use these formulations commercially?',
      answer: 'Yes, all formulations generated are yours to use commercially. You maintain full ownership and intellectual property rights. However, ensure you comply with local regulations for manufacturing and selling chemical products.'
    }
  ]

  return (
    <div className="w-full py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Section Title */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A2B4B] mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg text-[#6B7280] max-w-2xl mx-auto">
            Find answers to common questions about AI Formulator, formulations, and our services.
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-3 sm:space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden transition-all duration-300 hover:border-[#4A90E2]"
            >
              <button
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 text-left transition-colors duration-300 hover:bg-[#F8FBFF]"
              >
                <span className="text-base sm:text-lg font-semibold text-[#1A2B4B] leading-relaxed">
                  {faq.question}
                </span>
                <div className={`flex-shrink-0 text-[#4A90E2] transition-transform duration-300 ${expandedIndex === index ? 'rotate-180' : ''}`}>
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </button>

              {/* Expanded Answer */}
              {expandedIndex === index && (
                <div className="border-t border-[#E5E7EB] bg-[#F8FBFF] px-5 sm:px-6 py-4 sm:py-5">
                  <p className="text-sm sm:text-base text-[#6B7280] leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-12 sm:mt-16 text-center">
          <p className="text-[#6B7280] text-base sm:text-lg mb-6">
            Still have questions? We're here to help!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
            <button className="px-6 sm:px-8 py-3 sm:py-4 bg-[#4A90E2] text-white font-semibold rounded-lg hover:bg-[#2563eb] transition-all duration-300 shadow-md hover:shadow-lg">
              Contact Support
            </button>
            <button className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-[#4A90E2] text-[#4A90E2] font-semibold rounded-lg hover:bg-[#F8FBFF] transition-all duration-300">
              Email Us
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
