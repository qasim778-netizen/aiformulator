import { 
  Microscope, 
  BarChart3, 
  Award, 
  Grid3x3, 
  Zap,
  Brain,
  Calculator
} from 'lucide-react'

interface CardProps {
  icon: React.ElementType
  title: string
  description: string
  fullWidth?: boolean
}

function FeatureCard({ icon: Icon, title, description, fullWidth = false }: CardProps) {
  if (fullWidth) {
    return (
      <div className="lg:col-span-3 bg-gradient-to-r from-[#4A90E2] to-[#2563eb] rounded-2xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 p-8 sm:p-10 lg:p-12 flex flex-col sm:flex-row items-center justify-between gap-8 text-white" style={{ boxShadow: '0 10px 30px rgba(74,144,226,0.25)' }}>
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1">
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">
            {title}
          </h3>
          <p className="text-sm sm:text-base text-blue-100 leading-relaxed max-w-2xl">
            {description}
          </p>
        </div>
        <div className="flex-shrink-0 w-[68px] h-[68px] rounded-full border-2 border-white/40 flex items-center justify-center bg-white/10 backdrop-blur-sm">
          <Icon className="w-8 h-8 text-white" strokeWidth={1.5} />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl transition-all duration-300 hover:-translate-y-1 p-7 sm:p-8 flex flex-col items-center text-center h-full" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
      <div className="w-[68px] h-[68px] rounded-full flex items-center justify-center mb-5 flex-shrink-0 bg-gradient-to-br from-blue-50 to-blue-100">
        <Icon className="w-8 h-8 text-[#4A90E2]" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-[#1A2B4B] mb-3">
        {title}
      </h3>
      <p className="text-sm sm:text-base text-[#6B7280] leading-relaxed">
        {description}
      </p>
    </div>
  )
}

export default function WhyChooseFormulator() {
  const cards: CardProps[] = [
    {
      icon: Microscope,
      title: 'Lab-Grade Precision',
      description: 'Accurate ingredient percentages, validated pH ranges & viscosity targets.'
    },
    {
      icon: BarChart3,
      title: 'Cost Optimization',
      description: 'AI minimizes cost-per-litre while maintaining performance.'
    },
    {
      icon: Award,
      title: 'Industry-Standard Documentation',
      description: 'Includes batch records, safety notes, and step-by-step processing.'
    },
    {
      icon: Grid3x3,
      title: '50+ Product Categories',
      description: 'Cosmetics, detergents, adhesives, car care, pet care & more.'
    },
    {
      icon: Zap,
      title: 'Instant Custom Formulas',
      description: 'Generate complete formulas (ingredients + % + process + PDF).'
    },
    {
      icon: Brain,
      title: 'AI-Powered Formulator',
      description: 'Advanced machine learning optimizes formulations for performance, cost & compliance.'
    },
    {
      icon: Calculator,
      title: 'Price Calculator',
      description: 'Cost per litre + batch cost + kg to ton conversion tools built-in.',
      fullWidth: true
    }
  ]

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1A2B4B] mb-3 tracking-tight">
            Why Choose AIFormulator?
          </h2>
          <p className="text-base sm:text-lg text-[#6B7280] max-w-2xl mx-auto">
            Professional-grade formulation software designed for modern manufacturers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[30px]">
          {cards.map((card, index) => (
            <FeatureCard
              key={index}
              icon={card.icon}
              title={card.title}
              description={card.description}
              fullWidth={card.fullWidth}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
