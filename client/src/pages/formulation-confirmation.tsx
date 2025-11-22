import { Link, useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Download, FileText, Sparkles, User, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import SignInDialog from '@/components/signin-dialog';
import { useState } from 'react';

interface FormulationData {
  id: string;
  name: string;
  description: string;
  pdfUrl: string;
  textUrl: string;
  createdAt: string;
}

export default function FormulationConfirmation() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [showSignInDialog, setShowSignInDialog] = useState(false);
  const formulationId = params.id;

  // Fetch formulation data from API
  const { data: formulation, isLoading, error } = useQuery<FormulationData>({
    queryKey: ['/api/formulations', formulationId],
    queryFn: async () => {
      const response = await fetch(`/api/formulations/${formulationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch formulation');
      }
      return response.json();
    },
    enabled: !!formulationId,
  });

  // Redirect to home if no formulation ID
  if (!formulationId) {
    setLocation('/');
    return null;
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 font-semibold mb-4">Failed to load formulation</p>
              <Link href="/admin">
                <Button>Go to AI Wizard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDownloadPDF = () => {
    if (!user) {
      setShowSignInDialog(true);
      return;
    }
    if (formulation?.pdfUrl) {
      window.location.href = formulation.pdfUrl;
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Loading your formulation...</p>
        </div>
      </div>
    );
  }

  if (!formulation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SignInDialog open={showSignInDialog} onOpenChange={setShowSignInDialog} />
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-12 max-w-4xl">
        {/* Success Animation */}
        <div className="text-center mb-6 sm:mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full shadow-lg mb-3 sm:mb-4 animate-bounce-once">
            <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 px-4">
            Formulation Generated Successfully! 🎉
          </h1>
          <p className="text-gray-600 text-base sm:text-lg px-4">
            Your professional chemical formulation is ready to download
          </p>
        </div>

        {/* Formulation Details Card */}
        <Card className="mb-6 sm:mb-8 border-2 border-green-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b p-4 sm:p-6">
            <CardTitle className="flex items-center space-x-2 sm:space-x-3">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0" />
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 break-words">
                {formulation.name}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              {/* Download Links Section */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <Download className="h-5 w-5 mr-2 text-blue-600" />
                  Download Your Formulation
                </h3>
                
                {/* PDF Download - Full Width */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 sm:p-6 border-2 border-red-200 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-red-600 p-2 sm:p-3 rounded-lg">
                      <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-base sm:text-lg">PDF Format</h4>
                      <p className="text-xs sm:text-sm text-gray-600">Professional document</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleDownloadPDF}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-6 text-base sm:text-lg"
                    data-testid="button-download-pdf"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="pt-4 sm:pt-6 border-t border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">What's Next?</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Generate New Formula */}
                  <Link href="/admin">
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-5 sm:py-6 text-base sm:text-lg shadow-lg"
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
                      className="w-full border-2 border-gray-300 hover:bg-gray-50 font-bold py-5 sm:py-6 text-base sm:text-lg"
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
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center text-base sm:text-lg">
            <span className="text-xl mr-2">💡</span>
            Pro Tips
          </h3>
          <ul className="space-y-2 text-sm sm:text-base text-gray-700">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2 flex-shrink-0">•</span>
              <span>Save your PDF for professional documentation and sharing</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2 flex-shrink-0">•</span>
              <span>Check your account page to see all your generated formulations</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2 flex-shrink-0">•</span>
              <span>Download the PDF to your device for offline access</span>
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
