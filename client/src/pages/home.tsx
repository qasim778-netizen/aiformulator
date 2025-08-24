import { Link } from 'wouter'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-blue-50 to-white flex items-center justify-center">
      <div className="text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-5xl md:text-7xl font-inter font-bold text-gray-900 mb-6">
          ChemFormula
          <span className="text-primary block">Pro</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Professional Chemical Formulations for Small Business Manufacturers
        </p>
        <p className="text-lg text-gray-500 mb-12 max-w-3xl mx-auto">
          Access 68+ ready-to-use professional formulations across 10 product categories. 
          Create high-quality chemical products with tested recipes and detailed specifications.
        </p>
        <Link href="/browse">
          <a className="inline-block bg-primary text-white px-10 py-5 rounded-lg hover:bg-primary/90 transition-colors font-semibold text-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 duration-300">
            Browse Formulations
          </a>
        </Link>
      </div>
    </div>
  )
}