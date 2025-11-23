import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

export default function FAQ() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const faqs: FAQItem[] = [
    {
      question: 'What is AIFormulator?',
      answer: 'AIFormulator is an AI-powered platform that helps entrepreneurs and manufacturers create professional chemical formulations instantly. Whether you need cosmetics, detergents, adhesives, or other chemical products, our AI wizard generates precise, validated formulations with complete documentation.'
    },
    {
      question: 'Who is AIFormulator for?',
      answer: 'AIFormulator is designed for small business entrepreneurs, manufacturers, startups, and professionals who need to create or customize chemical formulations. It\'s perfect for those looking to launch products without expensive R&D teams.'
    },
    {
      question: 'Is it cloud-based?',
      answer: 'Yes, AIFormulator is a fully cloud-based platform. You can access it from anywhere, anytime, on any device. No software installation required.'
    },
    {
      question: 'Can AIFormulator create formulas for me?',
      answer: 'Absolutely! Our AI wizard generates complete formulations with precise ingredient percentages, process steps, safety notes, pH ranges, and viscosity targets. You get everything you need to manufacture.'
    },
    {
      question: 'Can I manage sample iterations and R&D projects?',
      answer: 'Yes, you can create, save, and organize multiple formulation iterations, manage R&D projects, and track all your samples with detailed batch records and notes.'
    },
    {
      question: 'Does AIFormulator support version control?',
      answer: 'Yes, all your formulations are automatically versioned, allowing you to track changes, compare versions, and revert to previous iterations if needed.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Your data is protected with enterprise-grade security, encrypted transmission, and secure servers. All your proprietary formulations and intellectual property are kept confidential.'
    },
    {
      question: 'Can my team collaborate in the platform?',
      answer: 'Yes, AIFormulator supports team collaboration. You can invite team members, assign roles, and work together on formulations in real-time.'
    },
    {
      question: 'Can AIFormulator integrate with other tools and platforms?',
      answer: 'We provide API documentation and support integrations with various platforms. Contact our team to discuss specific integration requirements for your business.'
    },
    {
      question: 'How does AIFormulator protect my intellectual property and formulation?',
      answer: 'Your formulations are stored securely with end-to-end encryption, user authentication, and access controls. You maintain complete ownership of all your proprietary formulations.'
    },
    {
      question: 'Does AIFormulator help with regulatory compliance?',
      answer: 'Yes, our formulations include compliance guidelines, safety data, regulatory documentation templates, and best practices for various industries and regions.'
    }
  ]

  return (
    <div className="w-full py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Title */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A2B4B] mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg text-[#6B7280] max-w-2xl mx-auto">
            Find answers to common questions about AIFormulator
          </p>
        </div>

        {/* FAQ Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border-b border-[#E5E7EB] pb-4 sm:pb-5"
            >
              <button
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                className="w-full flex items-start justify-between gap-4 text-left transition-colors duration-300 hover:text-[#4A90E2] group"
              >
                <span className="text-base sm:text-lg font-semibold text-[#1A2B4B] group-hover:text-[#4A90E2] transition-colors duration-300 leading-relaxed pr-4">
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
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </div>
              </button>

              {/* Expanded Answer */}
              {expandedIndex === index && (
                <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
                  <p className="text-sm sm:text-base text-[#6B7280] leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
