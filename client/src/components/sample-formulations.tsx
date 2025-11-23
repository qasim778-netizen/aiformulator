import { ArrowRight, Sparkles } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface FormulationCard {
  title: string
  description: string
  image: string
  category: string
}

export default function SampleFormulations() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    let scrollInterval: NodeJS.Timeout
    let currentScroll = 0

    const scroll = () => {
      if (container) {
        currentScroll += 2
        container.scrollLeft = currentScroll

        // Loop back to start when reaching the end
        if (currentScroll >= container.scrollWidth - container.clientWidth) {
          currentScroll = 0
        }
      }
    }

    scrollInterval = setInterval(scroll, 30)

    return () => clearInterval(scrollInterval)
  }, [])

  const formulations: FormulationCard[] = [
    {
      title: 'Car Polish Gloss Enhancer',
      description: 'Premium gloss-boosting polish for automotive surfaces.',
      image: '/assets/e7461a4b-5c0d-4c89-8856-515c4397f26a_1763879981422.png',
      category: 'Auto Care'
    },
    {
      title: 'Anti-Dandruff Shampoo',
      description: 'Gentle cleansing shampoo with scalp-active ingredients.',
      image: '/assets/b9947c62-dc86-4b9c-9734-fe6eb8825bff_1763879981421.png',
      category: 'Hair Care'
    },
    {
      title: 'Stone Adhesive',
      description: 'Industrial-strength adhesive for stone and tiles.',
      image: '/assets/4a266f5c-f647-4a7c-acee-203abd1383d3_1763879981419.png',
      category: 'Industrial'
    },
    {
      title: 'Toilet Cleaner Gel',
      description: 'Thick gel formula for stain removal and daily hygiene.',
      image: '/assets/ChatGPT Image Nov 22, 2025, 10_30_45 PM_1763880050790.png',
      category: 'Cleaners'
    },
    {
      title: 'Snow Foam Car Shampoo',
      description: 'High-foam shampoo for detailing and pressure-wash systems.',
      image: '/assets/ChatGPT Image Nov 22, 2025, 10_34_49 PM_1763879994487.png',
      category: 'Auto Care'
    },
    {
      title: 'Baby Body Wash',
      description: 'Mild, tear-free wash for sensitive baby skin.',
      image: '/assets/ChatGPT Image Nov 22, 2025, 10_36_23 PM_1763879994489.png',
      category: 'Baby Care'
    },
    {
      title: 'Fabric Softener',
      description: 'Softening and conditioning agent for laundry care.',
      image: '/assets/ChatGPT Image Nov 22, 2025, 10_38_08 PM_1763879994490.png',
      category: 'Laundry'
    },
    {
      title: 'All-Purpose Cleaner',
      description: 'Multipurpose cleaner for kitchens and household surfaces.',
      image: '/assets/743dab24-37f1-4016-9995-ddeb91c78081_1763879981421.png',
      category: 'Cleaners'
    }
  ]

  return (
    <div className="w-full py-12 sm:py-16 lg:py-20 px-4 sm:px-6 bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Title */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center justify-center gap-2 mb-3 px-4 py-2 bg-blue-100 rounded-full">
            <Sparkles className="w-4 h-4 text-[#4A90E2]" />
            <span className="text-sm font-semibold text-[#4A90E2]">Ready-Made Formulas</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A2B4B] mb-3">
            Sample Formulations
          </h2>
          <p className="text-base sm:text-lg text-[#6B7280] max-w-2xl mx-auto">
            Explore ready-made formulas across cosmetics, detergents, car care, and adhesives.
          </p>
        </div>

        {/* Horizontal Scroll Container */}
        <div className="mt-12 -mx-4 sm:-mx-6 px-4 sm:px-6">
          <div ref={scrollContainerRef} className="flex gap-6 sm:gap-8 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory">
            {formulations.map((formula, index) => (
              <div
                key={index}
                className="group flex-shrink-0 w-80 sm:w-96 bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col h-full snap-center"
              >
                {/* Image Container */}
                <div className="relative w-full h-56 sm:h-64 bg-gradient-to-br from-blue-50 to-white overflow-hidden flex items-center justify-center">
                  {/* Category Badge */}
                  <div className="absolute top-3 right-3 z-10 px-3 py-1 bg-[#4A90E2] text-white text-xs font-bold rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {formula.category}
                  </div>

                  {/* Product Image */}
                  <img
                    src={formula.image}
                    alt={formula.title}
                    className="w-auto h-full object-contain group-hover:scale-110 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />

                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%]" />
                </div>

                {/* Content Container */}
                <div className="flex-1 p-5 sm:p-6 flex flex-col">
                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-bold text-[#1A2B4B] mb-2 leading-snug group-hover:text-[#4A90E2] transition-colors duration-300">
                    {formula.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-[#6B7280] flex-grow mb-4 leading-relaxed">
                    {formula.description}
                  </p>

                  {/* Link */}
                  <a
                    href="#"
                    className="inline-flex items-center text-[#4A90E2] font-semibold hover:text-[#2563eb] group/link gap-2 transition-all duration-300"
                  >
                    View Formula
                    <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform duration-300" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <p className="text-[#6B7280] text-base sm:text-lg mb-6">
            Don't see what you're looking for?
          </p>
          <button className="inline-flex items-center justify-center px-8 py-3 sm:px-10 sm:py-4 bg-[#4A90E2] text-white font-bold rounded-xl hover:bg-[#2563eb] hover:shadow-lg transition-all duration-300 gap-2 text-base sm:text-lg">
            Create Custom Formula
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
