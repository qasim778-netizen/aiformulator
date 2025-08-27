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

  useEffect(() => {
    if (onReset) {
      generateCaptcha();
    }
  }, [onReset]);

  const handleVerify = () => {
    const correctAnswer = num1 + num2;
    const isCorrect = parseInt(userAnswer) === correctAnswer;
    
    if (isCorrect) {
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
      }, 1500);
    }
  };

  const handleInputChange = (value: string) => {
    setUserAnswer(value);
    setShowError(false);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Security Verification</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={generateCaptcha}
          className="h-6 w-6 p-0"
          data-testid="captcha-refresh"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded border">
          <span className="text-lg font-mono font-bold text-gray-800">
            {num1} + {num2} =
          </span>
        </div>
        
        <Input
          type="number"
          value={userAnswer}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
          placeholder="?"
          className="w-20 text-center"
          disabled={isVerified}
          data-testid="captcha-input"
        />
        
        <Button
          type="button"
          onClick={handleVerify}
          disabled={!userAnswer || isVerified}
          size="sm"
          data-testid="captcha-verify"
        >
          Verify
        </Button>
      </div>

      {showError && (
        <p className="text-sm text-red-600" data-testid="captcha-error">
          Incorrect answer. Please try again.
        </p>
      )}
      
      {isVerified && (
        <p className="text-sm text-green-600" data-testid="captcha-success">
          ✓ Verification successful
        </p>
      )}
    </div>
  );
}