export default function Footer() {
  return (
    <footer className="bg-secondary text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-inter font-semibold mb-4">ChemFormula Pro</h3>
            <p className="text-gray-300 text-sm">
              Professional chemical formulations for small business manufacturers worldwide.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-4">Categories</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="#" className="hover:text-white transition-colors duration-200">Skin Care</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Beauty Products</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Cleaning Products</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Organic Care</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="#" className="hover:text-white transition-colors duration-200">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Technical Support</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">Contact Info</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <p><i className="fas fa-envelope mr-2"></i>info@chemformulapro.com</p>
              <p><i className="fas fa-phone mr-2"></i>+1 (555) 123-4567</p>
              <p><i className="fas fa-map-marker-alt mr-2"></i>123 Chemistry Lane, Lab City</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-600 mt-8 pt-8 text-center text-sm text-gray-300">
          <p>&copy; 2024 ChemFormula Pro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
