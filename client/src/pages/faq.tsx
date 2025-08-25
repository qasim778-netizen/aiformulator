import { Card, CardContent } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { HelpCircle } from 'lucide-react'

export default function FAQ() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-blue-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <HelpCircle className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Frequently Asked Questions
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about AI Formulator, formulations, and our services.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>What is AI Formulator?</AccordionTrigger>
                  <AccordionContent>
                    AI Formulator is a comprehensive platform that provides small business manufacturers 
                    with access to 68+ professional chemical formulations and an AI-powered formulation 
                    wizard. We help you create high-quality products across categories like skincare, 
                    cleaning products, oral care, and more.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>Are the formulations safe and tested?</AccordionTrigger>
                  <AccordionContent>
                    Yes, all our formulations are professionally tested and follow industry safety standards. 
                    Each formulation includes detailed safety information, regulatory notes, and proper 
                    handling instructions. However, we recommend conducting your own testing for your 
                    specific use case and market requirements.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>How does the AI formulation wizard work?</AccordionTrigger>
                  <AccordionContent>
                    Our AI formulation wizard guides you through a 4-step process: selecting product type, 
                    specifying technical requirements, defining special properties, and generating custom 
                    formulations. The AI considers factors like pH levels, viscosity, cost optimization, 
                    and regulatory compliance to create professional-grade formulations.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger>Do I need authentication to use the service?</AccordionTrigger>
                  <AccordionContent>
                    You can browse all formulations and explore the platform freely without signing up. 
                    Authentication is only required for downloading PDF formulations, which gives you 
                    detailed manufacturing instructions, ingredient specifications, and quality protocols.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger>What categories of products do you cover?</AccordionTrigger>
                  <AccordionContent>
                    We cover 10+ product categories including: Skincare & Cosmetics, Cleaning Products, 
                    Oral Care, Hair Care, Personal Care, Industrial Chemicals, Specialty Formulations, 
                    and more. Each category contains multiple tested formulations with different 
                    difficulty levels and specifications.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger>Can I modify existing formulations?</AccordionTrigger>
                  <AccordionContent>
                    Yes, our formulations serve as excellent starting points that you can modify for 
                    your specific needs. Each formulation includes notes on possible variations and 
                    substitutions. For complex modifications, consider using our AI wizard to create 
                    custom formulations tailored to your requirements.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7">
                  <AccordionTrigger>What information is included in each formulation?</AccordionTrigger>
                  <AccordionContent>
                    Each formulation includes: complete ingredient list with percentages, step-by-step 
                    manufacturing instructions, technical specifications (pH, viscosity, etc.), 
                    safety information, estimated costs, batch size recommendations, shelf life, 
                    regulatory notes, and target market information.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-8">
                  <AccordionTrigger>How accurate are the cost estimations?</AccordionTrigger>
                  <AccordionContent>
                    Cost estimations are based on current market prices for raw materials and are 
                    updated regularly. However, actual costs may vary depending on your suppliers, 
                    location, purchase volumes, and market fluctuations. Use our estimates as a 
                    baseline for your budgeting and sourcing decisions.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-9">
                  <AccordionTrigger>Do you provide technical support?</AccordionTrigger>
                  <AccordionContent>
                    Yes, we offer technical support via email and phone. Our team includes experienced 
                    formulators who can help with questions about ingredients, processes, troubleshooting, 
                    and modifications. Premium support options are available for complex formulation 
                    projects.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-10">
                  <AccordionTrigger>Can I use these formulations commercially?</AccordionTrigger>
                  <AccordionContent>
                    Yes, all our formulations are designed for commercial use. However, you're responsible 
                    for ensuring compliance with local regulations, obtaining necessary permits, conducting 
                    required testing for your market, and following proper manufacturing practices. We 
                    recommend consulting with regulatory experts for specific compliance requirements.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Contact CTA */}
          <div className="text-center mt-8">
            <p className="text-gray-600 mb-4">
              Still have questions? We're here to help!
            </p>
            <div className="space-x-4">
              <a 
                href="/contact" 
                className="inline-block bg-primary text-white px-6 py-3 rounded-md hover:bg-primary/90 transition-colors"
                data-testid="link-contact-from-faq"
              >
                Contact Support
              </a>
              <a 
                href="mailto:support@aiformulator.com" 
                className="inline-block border border-primary text-primary px-6 py-3 rounded-md hover:bg-primary/5 transition-colors"
                data-testid="link-email-from-faq"
              >
                Email Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}