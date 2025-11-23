import { useEffect, useState } from 'react'
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import useEmblaCarousel from 'embla-carousel-react'
import AutoScroll from 'embla-carousel-autoplay'
import type { SampleProduct } from '@shared/schema'

export default function SampleFormulations() {
  const { data: formulations = [], isLoading } = useQuery({
    queryKey: ['/api/sample-products'],
    queryFn: async () => {
      const response = await fetch('/api/sample-products')
      if (!response.ok) throw new Error('Failed to fetch products')
      return response.json() as Promise<SampleProduct[]>
    },
  })

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: 'start',
      skipSnaps: false,
      dragFree: true,
    },
    [
      AutoScroll({
        playOnInit: true,
        delay: 4000,
        stopOnInteraction: true,
        stopOnMouseEnter: true,
      }),
    ]
  )

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const onDotButtonClick = (index: number) => {
    if (!emblaApi) return
    emblaApi.scrollTo(index)
  }

  const onPrevClick = () => {
    if (!emblaApi) return
    emblaApi.scrollPrev()
  }

  const onNextClick = () => {
    if (!emblaApi) return
    emblaApi.scrollNext()
  }

  useEffect(() => {
    if (!emblaApi) return

    setScrollSnaps(emblaApi.scrollSnapList())

    const onSelect = () => {
      const index = emblaApi.selectedIndex?.() ?? 0
      setSelectedIndex(index)
    }

    emblaApi.on('select', onSelect)
    onSelect()

    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi])

  if (isLoading) {
    return (
      <div className="w-full py-12 sm:py-16 lg:py-20 px-4 sm:px-6 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500">Loading sample formulations...</p>
        </div>
      </div>
    )
  }

  if (formulations.length === 0) {
    return null
  }

  return (
    <div className="w-full py-12 sm:py-16 lg:py-20 px-4 sm:px-6 bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Title */}
        <div className="text-center mb-12 sm:mb-16">
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

        {/* Carousel Container */}
        <div className="relative">
          {/* Carousel */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6 sm:gap-8">
              {formulations.map((formula) => (
                <div
                  key={formula.id}
                  className="flex-none min-w-0 sm:basis-1/2 lg:basis-1/3 group"
                >
                  <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col h-full">
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
                        href={formula.link}
                        className="inline-flex items-center text-[#4A90E2] font-semibold hover:text-[#2563eb] group/link gap-2 transition-all duration-300"
                      >
                        View Formula
                        <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform duration-300" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={onPrevClick}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-6 z-20 p-2 sm:p-3 bg-[#4A90E2] text-white rounded-full hover:bg-[#2563eb] transition-all duration-300 shadow-lg"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            onClick={onNextClick}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-6 z-20 p-2 sm:p-3 bg-[#4A90E2] text-white rounded-full hover:bg-[#2563eb] transition-all duration-300 shadow-lg"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Pagination Dots */}
        {scrollSnaps.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8 sm:mt-12">
            {scrollSnaps.map((_, index) => (
              <button
                key={index}
                onClick={() => onDotButtonClick(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === selectedIndex
                    ? 'w-3 h-3 bg-[#4A90E2]'
                    : 'w-2 h-2 bg-[#6B7280] hover:bg-[#4A90E2]'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}

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
