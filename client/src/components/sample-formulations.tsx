import { ArrowRight } from 'lucide-react'
import productImage from '@assets/2eba695e-48c8-4bf2-b1b9-a8580457196b_1763878247823.png'

interface FormulationCard {
  title: string
  description: string
  imagePosition: string
}

export default function SampleFormulations() {
  const formulations: FormulationCard[] = [
    {
      title: 'Car Polish Gloss Enhancer',
      description: 'Premium gloss-boosting polish for automotive surfaces.',
      imagePosition: '0% 0%'
    },
    {
      title: 'Anti-Dandruff Shampoo',
      description: 'Gentle cleansing shampoo with scalp-active ingredients.',
      imagePosition: '25% 0%'
    },
    {
      title: 'Stone Adhesive',
      description: 'Industrial-strength adhesive for stone and tiles.',
      imagePosition: '50% 0%'
    },
    {
      title: 'Toilet Cleaner Gel',
      description: 'Thick gel formula for stain removal and daily hygiene.',
      imagePosition: '75% 0%'
    },
    {
      title: 'Snow Foam Car Shampoo',
      description: 'High-foam shampoo for detailing and pressure-wash systems.',
      imagePosition: '0% 100%'
    },
    {
      title: 'Baby Body Wash',
      description: 'Mild, tear-free wash for sensitive baby skin.',
      imagePosition: '25% 100%'
    },
    {
      title: 'Fabric Softener',
      description: 'Softening and conditioning agent for laundry care.',
      imagePosition: '50% 100%'
    },
    {
      title: 'All-Purpose Cleaner',
      description: 'Multipurpose cleaner for kitchens and household surfaces.',
      imagePosition: '75% 100%'
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
              className="bg-white rounded-xl shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 p-6 flex flex-col items-center h-full"
            >
              {/* Product Image */}
              <div className="w-24 h-32 sm:w-28 sm:h-40 mb-4 rounded-lg overflow-hidden flex-shrink-0">
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${productImage})`,
                    backgroundPosition: formula.imagePosition,
                    backgroundSize: '400% 200%'
                  }}
                />
              </div>

              {/* Product Info */}
              <h3 className="text-lg sm:text-xl font-semibold text-[#1A2B4B] mb-2 text-center leading-snug">
                {formula.title}
              </h3>
              <p className="text-sm text-[#6B7280] mb-4 flex-grow text-center">
                {formula.description}
              </p>
              
              {/* Link */}
              <a
                href="#"
                className="inline-flex items-center text-[#4A90E2] font-semibold hover:underline transition-colors duration-300 gap-2 mt-auto"
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
