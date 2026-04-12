import { useState } from "react";
import AIFormulatorWizard from "@/components/ai-formulator-wizard";

export default function GeneratePage() {
  const [isWizardActive, setIsWizardActive] = useState(false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F5F2" }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AIFormulatorWizard onWizardStateChange={setIsWizardActive} />
      </div>
    </div>
  );
}
