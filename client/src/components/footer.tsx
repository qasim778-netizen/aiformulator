import { Link } from "wouter";
import { Settings } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-secondary text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-inter font-semibold mb-4">AIFormulator</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <div>AI-powered chemical formulation platform</div>
              <div>Professional formulations for manufacturers</div>
              <div>Instant generation with safety guidelines</div>
              <div>Expert support and quality standards</div>
            </div>
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
              <li>
                <Link href="/browse">
                  <span className="hover:text-white transition-colors duration-200 cursor-pointer" data-testid="link-footer-find-formulation">
                    Find Formulation
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/about">
                  <span className="hover:text-white transition-colors duration-200 cursor-pointer" data-testid="link-footer-about">
                    About Us
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/faq">
                  <span className="hover:text-white transition-colors duration-200 cursor-pointer" data-testid="link-footer-faq">
                    FAQ
                  </span>
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">Contact Info</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <p><i className="fas fa-envelope mr-2"></i>info@aiformulator.com</p>
              <p><i className="fas fa-phone mr-2"></i>+1 (555) 123-4567</p>
              <p><i className="fas fa-map-marker-alt mr-2"></i>123 Chemistry Lane, Lab City</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-600 mt-8 pt-8">
          <div className="text-center mb-4">
            <div className="flex flex-wrap justify-center items-center space-x-6 text-xs text-gray-400">
              <Link href="/terms-of-service">
                <span className="hover:text-gray-300 transition-colors duration-200 cursor-pointer" data-testid="link-footer-terms">
                  Terms & Conditions
                </span>
              </Link>
              <Link href="/privacy-policy">
                <span className="hover:text-gray-300 transition-colors duration-200 cursor-pointer" data-testid="link-footer-privacy">
                  Privacy Policy
                </span>
              </Link>
              <Link href="/disclaimer">
                <span className="hover:text-gray-300 transition-colors duration-200 cursor-pointer" data-testid="link-footer-disclaimer">
                  Disclaimer of Use
                </span>
              </Link>
            </div>
          </div>
          <div className="text-center text-sm text-gray-300">
            <p>&copy; 2025 AIFormulator. All rights reserved.</p>
            <div className="mt-3">
              <Link href="/admin">
                <span className="text-xs text-gray-400 hover:text-gray-300 transition-colors duration-200 cursor-pointer inline-flex items-center">
                  <Settings className="h-3 w-3 mr-1" />
                  System Administration
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
