import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import CategoryCard from '../components/category-card'
import SearchBar from '../components/search-bar'
import { useLocation } from 'wouter'
import { HelpButton } from '@/components/ui/help-button'
import { useGuidance } from '@/hooks/use-guidance'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'
import AIFormulatorWizard from '@/components/ai-formulator-wizard'
import type { Category } from "@shared/schema"
import { FORMULATION_CATEGORIES } from "@/constants/categories"

interface Formulation {
  id: string
  name: string
  categoryId: string
  description: string
  ingredients: string
  instructions: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  batchSize: string
  estimatedCost: string
  preparationTime: string
  shelfLife: string
  keyBenefits: string
  targetMarket: string
  regulatoryNotes: string
  imageUrl?: string
}

export default function Browse() {
  const [, setLocation] = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [isWizardActive, setIsWizardActive] = useState(false)
  const { startGuidance, isCompleted } = useGuidance()
  
  // Auto-start guidance for first-time users
  useEffect(() => {
    if (!isCompleted("formulation-browse")) {
      const timer = setTimeout(() => {
        startGuidance("formulation-browse");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [startGuidance, isCompleted])

  // Use the new 22 formulation categories for browse page
  const categories = FORMULATION_CATEGORIES;
  const categoriesLoading = false;

  const { data: formulations = [] } = useQuery<Formulation[]>({
    queryKey: ['/api/formulations'],
  })

  const getFormulationCount = (categoryId: string) => {
    return formulations.filter(f => f.categoryId === categoryId).length
  }

  // Filter categories and formulations based on search query
  const filteredCategories = searchQuery.trim() 
    ? categories.filter(category => 
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        formulations.some(f => 
          f.categoryId === category.id && 
          (f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           f.description.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      )
    : categories

  const getFilteredFormulationCount = (categoryId: string) => {
    if (!searchQuery.trim()) {
      return getFormulationCount(categoryId)
    }
    return formulations.filter(f => 
      f.categoryId === categoryId && 
      (f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       f.description.toLowerCase().includes(searchQuery.toLowerCase()))
    ).length
  }

  const handleSearch = (query: string) => {
    console.log('Browse page handleSearch called with:', query);
    setSearchQuery(query)
    // Scroll to categories section to show filtered results
    setTimeout(() => {
      const categoriesSection = document.getElementById('categories')
      if (categoriesSection) {
        categoriesSection.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  if (categoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-blue-50 to-white overflow-x-hidden w-full">
      <div className="responsive-container mx-auto py-4 sm:py-6 lg:py-8 w-full max-w-7xl">
        {/* Browse Content - Hidden when wizard is active */}
        {!isWizardActive && (
          <>
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-blue-50 to-white py-4 rounded-lg mb-8">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                  <h1 className="text-2xl md:text-3xl font-inter font-bold text-gray-900 mb-3">
                    Professional Chemical
                    <span className="text-primary block">Formulations</span>
                  </h1>
                  <p className="text-base text-gray-600 mb-3 max-w-3xl mx-auto">
                    Access 68+ ready-to-use professional formulations across 10 product categories. 
                    Perfect for small business manufacturers looking to create high-quality chemical products.
                  </p>
                  <div className="flex justify-center mb-0">
                    <SearchBar 
                      onSearch={handleSearch}
                      placeholder="Search formulations or categories…"
                      className="w-full max-w-md"
                      data-testid="search-formulations"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section className="py-4 bg-white rounded-lg mb-4">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center p-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                      <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Tested Formulations</h3>
                    <p className="text-gray-600">
                      All formulations are professionally tested and ready for production
                    </p>
                  </div>
                  <div className="text-center p-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                      <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast Production</h3>
                    <p className="text-gray-600">
                      Quick setup with detailed instructions and ingredient specifications
                    </p>
                  </div>
                  <div className="text-center p-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                      <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Complete Documentation</h3>
                    <p className="text-gray-600">
                      Ready-to-use formulations to accelerate your product development
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Categories Overview */}
            <section id="categories" className="py-6 bg-gray-50 rounded-lg mb-8">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-inter font-bold text-gray-900 mb-3">
                    {searchQuery.trim() ? `Search Results for "${searchQuery}"` : 'Product Categories'}
                  </h2>
                  <p className="text-base text-gray-600 mb-4">
                    {searchQuery.trim() 
                      ? `Found ${filteredCategories.length} categories matching your search`
                      : 'Choose from our comprehensive range of formulation categories'
                    }
                  </p>
                  {searchQuery.trim() && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-primary hover:text-primary/80 text-sm underline mb-4"
                    >
                      Clear search and show all categories
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((category, index) => (
                      <CategoryCard
                        key={category.id}
                        category={category}
                        formulationCount={getFilteredFormulationCount(category.id)}
                        index={index}
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <p className="text-gray-500 text-lg">No categories found matching "{searchQuery}"</p>
                      <p className="text-gray-400 text-sm mt-2">Try searching with different keywords</p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Custom Formulation Card */}
            <section id="custom-formulation" className="py-4">
              <div className="flex justify-center mb-4 sm:mb-6">
                <Card className="max-w-md w-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] touch-target ring-2 ring-primary bg-primary/5 border-primary">
                  <CardContent className="p-4 sm:p-5 lg:p-6 text-center">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white p-4 rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-3 shadow-lg">
                      <Sparkles className="h-8 w-8" />
                    </div>
                    <h3 className="text-responsive-xl font-bold text-gray-900 mb-2">Create Custom Formula</h3>
                    <p className="text-gray-600 text-responsive-sm">AI-powered formulation wizard with precise specifications</p>
                  </CardContent>
                </Card>
              </div>
            </section>
          </>
        )}

        {/* AI Formulator Wizard */}
        <div className={isWizardActive ? "mt-0" : "mt-8"}>
          <AIFormulatorWizard onWizardStateChange={setIsWizardActive} />
        </div>
      </div>
    </div>
  )
}