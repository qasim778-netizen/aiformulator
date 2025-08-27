import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw } from "lucide-react";

interface CaptchaProps {
  onVerify: (isValid: boolean) => void;
  onReset?: () => void;
}

export function Captcha({ onVerify, onReset }: CaptchaProps) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [showError, setShowError] = useState(false);

  const generateCaptcha = () => {
    const newNum1 = Math.floor(Math.random() * 10) + 1;
    const newNum2 = Math.floor(Math.random() * 10) + 1;
    setNum1(newNum1);
    setNum2(newNum2);
    setUserAnswer("");
    setIsVerified(false);
    setShowError(false);
    onVerify(false);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  // Remove the problematic useEffect that resets on onReset prop change
  // The parent component will use the key prop to force re-render when needed

  const handleVerify = () => {
    const correctAnswer = num1 + num2;
    const userAnswerNumber = Number(userAnswer.trim());
    
    console.log('Captcha verification:', { 
      num1, 
      num2, 
      correctAnswer, 
      userAnswer: userAnswer.trim(), 
      userAnswerNumber, 
      isCorrect: userAnswerNumber === correctAnswer 
    });
    
    if (userAnswerNumber === correctAnswer) {
      setIsVerified(true);
      setShowError(false);
      onVerify(true);
    } else {
      setShowError(true);
      setIsVerified(false);
      onVerify(false);
      // Generate new captcha after wrong answer
      setTimeout(() => {
        generateCaptcha();
      }, 2000);
    }
  };

  const handleInputChange = (value: string) => {
    setUserAnswer(value);
    setShowError(false);
  };

  return (
    <div className="space-y-6 p-6 border-2 border-blue-200 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
      <div className="text-center">
        <div className="flex items-center justify-center mb-3">
          <div className="bg-blue-100 p-3 rounded-full mr-3">
            <span className="text-2xl">🔒</span>
          </div>
          <div>
            <Label className="text-lg font-bold text-blue-900">Security Verification Required</Label>
            <p className="text-sm text-blue-700 mt-1">Complete this step to generate your formulation</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={generateCaptcha}
            className="ml-auto h-8 w-8 p-0 hover:bg-blue-100"
            data-testid="captcha-refresh"
          >
            <RefreshCw className="h-4 w-4 text-blue-600" />
          </Button>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg border border-blue-200 shadow-sm">
        <div className="flex items-center justify-center space-x-4">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-lg shadow-md">
            <span className="text-2xl font-bold font-mono">
              {num1} + {num2} = ?
            </span>
          </div>
          
          <Input
            type="number"
            value={userAnswer}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
            placeholder="Enter answer"
            className="w-32 text-center text-xl font-bold border-2 border-blue-300 focus:border-blue-500 focus:ring-blue-500"
            disabled={isVerified}
            data-testid="captcha-input"
          />
          
          <Button
            type="button"
            onClick={handleVerify}
            disabled={!userAnswer || isVerified}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 font-bold shadow-md"
            data-testid="captcha-verify"
          >
            Verify
          </Button>
        </div>
      </div>

      {showError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center" data-testid="captcha-error">
          <p className="text-red-700 font-medium">❌ Incorrect answer. Please try again.</p>
        </div>
      )}
      
      {isVerified && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center" data-testid="captcha-success">
          <p className="text-green-700 font-bold text-lg">✅ Verification Successful!</p>
          <p className="text-green-600 text-sm mt-1">You can now generate your formulation</p>
        </div>
      )}
    </div>
  );
}