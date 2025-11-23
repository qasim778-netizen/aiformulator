import { ArrowRight } from 'lucide-react'

interface FormulationCard {
  title: string
  description: string
}

export default function SampleFormulations() {
  const formulations: FormulationCard[] = [
    {
      title: 'Car Polish Gloss Enhancer',
      description: 'Premium gloss-boosting polish for automotive surfaces.'
    },
    {
      title: 'Anti-Dandruff Shampoo',
      description: 'Gentle cleansing shampoo with scalp-active ingredients.'
    },
    {
      title: 'Stone Adhesive',
      description: 'High-strength adhesive for marble, tiles, and stone.'
    },
    {
      title: 'Toilet Cleaner Gel',
      description: 'Thick gel cleaner for stain removal and disinfection.'
    },
    {
      title: 'Snow Foam Car Shampoo',
      description: 'High-foam automotive shampoo for detailing use.'
    },
    {
      title: 'Baby Body Wash',
      description: 'Mild, tear-free formula for delicate baby skin.'
    },
    {
      title: 'Fabric Softener',
      description: 'Silky soft conditioning agent for laundry care.'
    },
    {
      title: 'All-Purpose Cleaner',
      description: 'Multipurpose cleaner for kitchens, floors, and surfaces.'
    }
  ]

  return (
    <div className="w-full py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Title */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A2B4B] mb-3">
            Sample Formulations
          </h2>
          <p className="text-base sm:text-lg text-[#6B7280] max-w-2xl mx-auto">
            Explore ready-made formulas across cosmetics, detergents, car care, and adhesives.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {formulations.map((formula, index) => (
            <div
              key={index}
              className="bg-white rounded-[20px] shadow-md hover:shadow-lg transition-shadow duration-300 p-6 sm:p-8 flex flex-col h-full"
            >
              <h3 className="text-lg sm:text-xl font-bold text-[#1A2B4B] mb-3 leading-snug">
                {formula.title}
              </h3>
              <p className="text-sm sm:text-base text-[#6B7280] mb-6 flex-grow">
                {formula.description}
              </p>
              <a
                href="#"
                className="inline-flex items-center text-[#4A90E2] font-semibold hover:text-[#2563eb] transition-colors duration-300 gap-2"
              >
                View Formula
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
