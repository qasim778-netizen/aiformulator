import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Navbar() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const isActive = (path: string) => location === path;

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <h1 className="text-xl font-inter font-bold text-primary cursor-pointer">
                  ChemFormula Pro
                </h1>
              </Link>
            </div>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <Link href="/">
                  <a className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive("/") 
                      ? "text-primary" 
                      : "text-gray-600 hover:text-primary"
                  }`}>
                    Home
                  </a>
                </Link>
                <a 
                  href="#categories" 
                  className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Categories
                </a>
                <a 
                  href="#about" 
                  className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  About
                </a>
                <a 
                  href="#contact" 
                  className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Contact
                </a>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search formulations..."
                className="w-64 pl-10 pr-4 py-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            </div>
            <Link href="/admin">
              <Button className="bg-primary text-white hover:bg-blue-700">
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
