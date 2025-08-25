import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";

interface SignInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export default function SignInDialog({ 
  open, 
  onOpenChange, 
  title = "Sign In Required",
  description = "Please sign in to download formulations and save your work."
}: SignInDialogProps) {
  const handleSignIn = () => {
    window.location.href = "/api/login";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <LogIn className="h-5 w-5 mr-2 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Why sign in?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Download your custom formulations as PDF</li>
              <li>• Save and access your formulation history</li>
              <li>• Get personalized recommendations</li>
              <li>• Secure and free account</li>
            </ul>
          </div>
          
          <div className="flex flex-col space-y-3">
            <Button 
              onClick={handleSignIn}
              className="w-full bg-primary hover:bg-primary/90"
              data-testid="button-signin"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In / Sign Up
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
              data-testid="button-cancel-signin"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}