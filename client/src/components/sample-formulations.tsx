import { ArrowRight, Sparkles } from 'lucide-react'
import stoneAdhesiveImg from '@assets/4dae56dc-4029-42c8-84bb-f024cc1b8efa-min_1763884454972.png'
import allPurposeCleanerImg from '@assets/743dab24-37f1-4016-9995-ddeb91c78081-min_1763884454973.png'
import antiDandruffImg from '@assets/gfd-min_1763884454976.png'

// Dynamically construct image paths with spaces in file names
const toiletCleanerImg = '/assets/ChatGPT Image Nov 22, 2025, 10_30_45 PM-min_1763884454973.png'
const snowFoamImg = '/assets/ChatGPT Image Nov 22, 2025, 10_34_49 PM-min_1763884454974.png'
const babyBodyWashImg = '/assets/ChatGPT Image Nov 22, 2025, 10_36_23 PM-min_1763884454974.png'
const fabricSoftenerImg = '/assets/ChatGPT Image Nov 22, 2025, 10_38_08 PM-min_1763884454975.png'

interface FormulationCard {
  title: string
  description: string
  image: string
  category: string
}

export default function SampleFormulations() {

  const formulations: FormulationCard[] = [
    {
      title: 'Stone Adhesive',
      description: 'Industrial-strength adhesive for stone and tiles.',
      image: stoneAdhesiveImg,
      category: 'Industrial'
    },
    {
      title: 'All-Purpose Cleaner',
      description: 'Multipurpose cleaner for kitchens and household surfaces.',
      image: allPurposeCleanerImg,
      category: 'Cleaners'
    },
    {
      title: 'Toilet Cleaner Gel',
      description: 'Thick gel formula for stain removal and daily hygiene.',
      image: toiletCleanerImg,
      category: 'Cleaners'
    },
    {
      title: 'Snow Foam Car Shampoo',
      description: 'High-foam shampoo for detailing and pressure-wash systems.',
      image: snowFoamImg,
      category: 'Auto Care'
    },
    {
      title: 'Baby Body Wash',
      description: 'Mild, tear-free wash for sensitive baby skin.',
      image: babyBodyWashImg,
      category: 'Baby Care'
    },
    {
      title: 'Fabric Softener',
      description: 'Softening and conditioning agent for laundry care.',
      image: fabricSoftenerImg,
      category: 'Laundry'
    },
    {
      title: 'Anti-Dandruff Shampoo',
      description: 'Gentle cleansing shampoo with scalp-active ingredients.',
      image: antiDandruffImg,
      category: 'Hair Care'
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

        {/* Grid Container */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {formulations.map((formula, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col h-full"
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
