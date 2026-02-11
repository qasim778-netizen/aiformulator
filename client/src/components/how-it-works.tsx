import { Grid3x3, ClipboardList, FlaskConical, ChevronRight } from 'lucide-react'

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
      icon: ClipboardList,
    },
    {
      number: '3️⃣',
      title: 'Get Full Formula',
      description: '(Ingredients + % + Process + Safety + PDF)',
      icon: FlaskConical,
    },
  ]

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1A2B4B] mb-3 tracking-tight">
            How It Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[30px]">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={index} className="flex flex-col items-center bg-white rounded-2xl p-8" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <div className="w-[68px] h-[68px] rounded-full border-4 border-[#4A90E2] flex items-center justify-center mb-6 bg-gradient-to-br from-blue-50 to-white">
                  <Icon className="w-8 h-8 text-[#4A90E2]" strokeWidth={1.5} />
                </div>

                <div className="text-center">
                  <div className="text-2xl sm:text-3xl mb-2">{step.number}</div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#1A2B4B] mb-2 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-sm sm:text-base text-[#6B7280] max-w-xs">
                    {step.description}
                  </p>
                </div>

                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute mt-32">
                    <div className="text-[#4A90E2] text-3xl ml-12 lg:ml-16">→</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="md:hidden flex flex-col items-center gap-4 mt-8">
          {[0, 1].map((i) => (
            <ChevronRight key={i} className="w-6 h-6 text-[#4A90E2] rotate-90" />
          ))}
        </div>
      </div>
    </div>
  )
}
