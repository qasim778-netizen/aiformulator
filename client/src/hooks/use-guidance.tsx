import { useState, useEffect } from "react";

interface TooltipStep {
  id: string;
  target: string;
  title: string;
  content: string;
  position: "top" | "bottom" | "left" | "right";
  action?: string;
}

interface GuidanceConfig {
  [key: string]: TooltipStep[];
}

const GUIDANCE_STORAGE_KEY = "chemformula_guidance_completed";

// Predefined guidance flows for different pages/features
const guidanceFlows: GuidanceConfig = {
  "ai-formulator": [
    {
      id: "product-type",
      target: "[data-testid='wizard-step-1']",
      title: "Choose Your Product Type",
      content: "Start by selecting the category of chemical product you want to create. This helps our AI understand the specific requirements and regulations for your formulation.",
      position: "bottom",
      action: "Click on one of the product categories below"
    },
    {
      id: "specifications",
      target: "[data-testid='wizard-step-2']",
      title: "Set Product Specifications",
      content: "Define the physical and chemical properties of your product. These specifications ensure the AI generates a formulation that meets your exact requirements.",
      position: "right",
      action: "Fill in the target viscosity and select additional properties"
    },
    {
      id: "requirements",
      target: "[data-testid='wizard-step-3']",
      title: "Add Special Requirements",
      content: "Specify any special characteristics your product needs, such as being organic, vegan-friendly, or having specific performance features.",
      position: "left",
      action: "Toggle any requirements that apply to your product"
    },
    {
      id: "generation",
      target: "[data-testid='wizard-step-4']",
      title: "Generate Your Formulation",
      content: "Review your selections and generate a professional chemical formulation. The AI will create a complete recipe with ingredients, proportions, and manufacturing instructions.",
      position: "top",
      action: "Click 'Generate Formulation' to create your custom recipe"
    }
  ],
  "formulation-browse": [
    {
      id: "browse-intro",
      target: ".max-w-7xl",
      title: "Formulation Database",
      content: "Welcome to our comprehensive database of professional chemical formulations. Explore categories and search for specific formulations.",
      position: "bottom",
      action: "Use the search bar or browse categories below"
    }
  ],
  "admin-overview": [
    {
      id: "dashboard",
      target: "[data-testid='admin-overview-tab']",
      title: "Admin Dashboard Overview",
      content: "Welcome to the admin dashboard! Here you can view key statistics about your chemical formulation database and recent system activity.",
      position: "bottom",
      action: "Explore the statistics cards to see your data summary"
    },
    {
      id: "categories-management",
      target: "[data-testid='admin-categories-tab']",
      title: "Manage Categories",
      content: "Create and organize product categories. Categories help users find relevant formulations and provide structure to your chemical database.",
      position: "bottom",
      action: "Click to view and manage your product categories"
    },
    {
      id: "formulations-management",
      target: "[data-testid='admin-formulations-tab']",
      title: "Manage Formulations",
      content: "Add, edit, and organize your chemical formulations. You can manually create formulations or use AI generation to build your database.",
      position: "bottom",
      action: "Click to access formulation management tools"
    },
    {
      id: "analytics",
      target: "[data-testid='admin-analytics-tab']",
      title: "AI Analytics",
      content: "Track how users interact with your formulations and monitor AI generation patterns. This helps you understand usage trends and optimize your content.",
      position: "bottom",
      action: "Click to view detailed analytics and usage statistics"
    }
  ]
};

export function useGuidance() {
  const [activeFlow, setActiveFlow] = useState<string | null>(null);
  const [completedFlows, setCompletedFlows] = useState<string[]>([]);

  useEffect(() => {
    // Load completed guidance flows from localStorage
    const stored = localStorage.getItem(GUIDANCE_STORAGE_KEY);
    if (stored) {
      try {
        setCompletedFlows(JSON.parse(stored));
      } catch {
        setCompletedFlows([]);
      }
    }
  }, []);

  const startGuidance = (flowId: string, force = false) => {
    if (!force && completedFlows.includes(flowId)) {
      return; // Don't start if already completed
    }
    setActiveFlow(flowId);
  };

  const completeGuidance = (flowId: string) => {
    const updated = [...completedFlows, flowId];
    setCompletedFlows(updated);
    localStorage.setItem(GUIDANCE_STORAGE_KEY, JSON.stringify(updated));
    setActiveFlow(null);
  };

  const skipGuidance = () => {
    setActiveFlow(null);
  };

  const resetGuidance = (flowId?: string) => {
    if (flowId) {
      const updated = completedFlows.filter(id => id !== flowId);
      setCompletedFlows(updated);
      localStorage.setItem(GUIDANCE_STORAGE_KEY, JSON.stringify(updated));
    } else {
      setCompletedFlows([]);
      localStorage.removeItem(GUIDANCE_STORAGE_KEY);
    }
  };

  const isCompleted = (flowId: string) => {
    return completedFlows.includes(flowId);
  };

  const getSteps = (flowId: string) => {
    return guidanceFlows[flowId] || [];
  };

  return {
    activeFlow,
    startGuidance,
    completeGuidance,
    skipGuidance,
    resetGuidance,
    isCompleted,
    getSteps,
    guidanceFlows: Object.keys(guidanceFlows)
  };
}