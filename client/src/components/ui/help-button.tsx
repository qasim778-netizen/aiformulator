import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { useGuidance } from "@/hooks/use-guidance";

interface HelpButtonProps {
  flowId: string;
  variant?: "default" | "ghost" | "outline";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function HelpButton({ flowId, variant = "ghost", size = "sm", className = "" }: HelpButtonProps) {
  const { startGuidance } = useGuidance();

  const handleClick = () => {
    startGuidance(flowId, true); // Force start even if completed
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={`text-blue-600 hover:text-blue-800 ${className}`}
      title="Get help with this feature"
      data-testid={`help-button-${flowId}`}
    >
      <HelpCircle className="h-4 w-4" />
      {size !== "sm" && <span className="ml-2">Help</span>}
    </Button>
  );
}