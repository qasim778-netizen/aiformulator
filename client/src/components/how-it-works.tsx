import { Grid3x3, CheckCircle2, FlaskConical, ChevronRight } from 'lucide-react'

export default function HowItWorks() {
  const steps = [
    {
      number: '1️⃣',
      title: 'Product Name & Type',
      description: '(Product name + consistency type)',
      icon: Grid3x3,
    },
    {
      number: '2️⃣',
      title: 'Enter Requirements',
      description: '(pH, viscosity, natural/sulfate-free, cost goals)',
      icon: CheckCircle2,
    },
    {
      number: '3️⃣',
      title: 'Get Full Formula',
      description: '(Ingredients + % + Process + Safety + PDF)',
      icon: FlaskConical,
    },
  ]

  return (
    <div className="w-full py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Title */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A2B4B] mb-3">
            How It Works
          </h2>
        </div>

        {/* Steps Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={index} className="flex flex-col items-center">
                {/* Icon Circle */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-[#4A90E2] flex items-center justify-center mb-6 bg-gradient-to-br from-[#F8FBFF] to-white hover:shadow-lg transition-shadow duration-300">
                  <Icon className="w-12 h-12 sm:w-14 sm:h-14 text-[#4A90E2]" strokeWidth={1.5} />
                </div>

                {/* Step Number and Title */}
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl mb-2">{step.number}</div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#1A2B4B] mb-2 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-sm sm:text-base text-[#6B7280] max-w-xs">
                    {step.description}
                  </p>
                </div>

                {/* Arrow (hidden on mobile, visible on desktop between items) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute mt-32">
                    <div className="text-[#4A90E2] text-3xl ml-12 lg:ml-16">→</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Mobile Arrows */}
        <div className="md:hidden flex flex-col items-center gap-4 mt-8">
          {[0, 1].map((i) => (
            <ChevronRight key={i} className="w-6 h-6 text-[#4A90E2] rotate-90" />
          ))}
        </div>
      </div>
    </div>
  )
}
