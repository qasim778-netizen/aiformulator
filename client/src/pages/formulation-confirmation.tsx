import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Download, FileText, Sparkles, User } from 'lucide-react';

interface FormulationData {
  id?: number;
  name: string;
  pdfUrl?: string;
  textUrl?: string;
}

export default function FormulationConfirmation() {
  const [, setLocation] = useLocation();
  const [formulation, setFormulation] = useState<FormulationData | null>(null);

  useEffect(() => {
    // Get formulation data from session storage
    const savedData = sessionStorage.getItem('generated_formulation');
    if (savedData) {
      const data = JSON.parse(savedData);
      setFormulation(data);
      // Clear session storage after reading
      sessionStorage.removeItem('generated_formulation');
    } else {
      // If no data, redirect to home
      setLocation('/');
    }
  }, [setLocation]);

  const handleDownloadPDF = () => {
    if (formulation?.pdfUrl) {
      window.open(formulation.pdfUrl, '_blank');
    }
  };

  const handleDownloadText = () => {
    if (formulation?.textUrl) {
      window.open(formulation.textUrl, '_blank');
    }
  };

  if (!formulation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Success Animation */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full shadow-lg mb-4 animate-bounce-once">
            <CheckCircle className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Formulation Generated Successfully! 🎉
          </h1>
          <p className="text-gray-600 text-lg">
            Your professional chemical formulation is ready to download
          </p>
        </div>

        {/* Formulation Details Card */}
        <Card className="mb-8 border-2 border-green-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b">
            <CardTitle className="flex items-center space-x-3">
              <Sparkles className="h-6 w-6 text-green-600" />
              <span className="text-2xl font-bold text-gray-900">
                {formulation.name}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Formula Name Display */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Formula Name</h3>
                <p className="text-2xl font-bold text-gray-900">{formulation.name}</p>
              </div>

              {/* Download Links Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Download className="h-5 w-5 mr-2 text-blue-600" />
                  Download Your Formulation
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* PDF Download */}
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border-2 border-red-200 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-red-600 p-3 rounded-lg">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">PDF Format</h4>
                        <p className="text-xs text-gray-600">Professional document</p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleDownloadPDF}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
                      data-testid="button-download-pdf"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>

                  {/* Text Download */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-200 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-blue-600 p-3 rounded-lg">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Text Format</h4>
                        <p className="text-xs text-gray-600">Plain text version</p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleDownloadText}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                      data-testid="button-download-text"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Text
                    </Button>
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Generate New Formula */}
                  <Link href="/admin">
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-6 text-lg shadow-lg"
                      data-testid="button-generate-new"
                    >
                      <Sparkles className="h-5 w-5 mr-2" />
                      Generate New Formula
                    </Button>
                  </Link>

                  {/* Go to My Account */}
                  <Link href="/my-account">
                    <Button 
                      variant="outline"
                      className="w-full border-2 border-gray-300 hover:bg-gray-50 font-bold py-6 text-lg"
                      data-testid="button-my-account"
                    >
                      <User className="h-5 w-5 mr-2" />
                      Go to My Account Page
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips Section */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <span className="text-xl mr-2">💡</span>
            Pro Tips
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Save your PDF for professional documentation and sharing</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Use the text format for easy copying and editing</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Check your account page to see all your generated formulations</span>
            </li>
          </ul>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounce-once {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .animate-bounce-once {
          animation: bounce-once 1s ease-in-out;
        }
      `}</style>
    </div>
  );
}
