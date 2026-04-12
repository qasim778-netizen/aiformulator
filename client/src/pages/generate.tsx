import { useEffect } from "react";

export default function GeneratePage() {
  useEffect(() => {
    window.location.replace("https://app.aiformulator.net");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F7F5F2" }}>
      <p className="text-gray-500 text-sm">Redirecting to AI Formulator…</p>
    </div>
  );
}
