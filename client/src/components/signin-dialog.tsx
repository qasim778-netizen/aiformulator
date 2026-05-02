import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SiReplit } from "react-icons/si";
import { FlaskConical, Download, Star, Wand2 } from "lucide-react";
import { useState } from "react";

interface SignInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

const PERKS = [
  { icon: Download, text: "Download professional PDF formulations" },
  { icon: Wand2,    text: "Save your AI-generated formulas" },
  { icon: Star,     text: "Build your personal formula library" },
  { icon: FlaskConical, text: "100% free — no credit card needed" },
];

export default function SignInDialog({
  open,
  onOpenChange,
  title = "Sign In to Continue",
  description = "Create a free account instantly — no password needed.",
}: SignInDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleSignIn = () => {
    setLoading(true);
    window.location.href = "/api/login";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">

        {/* Top accent strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-teal-400 via-emerald-500 to-teal-600" />

        <div className="px-7 py-6">
          <DialogHeader className="mb-5">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center border border-teal-100">
                <FlaskConical className="h-6 w-6 text-teal-600" />
              </div>
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900 text-center leading-tight">
              {title}
            </DialogTitle>
            <p className="text-sm text-gray-500 text-center leading-relaxed mt-1">
              {description}
            </p>
          </DialogHeader>

          {/* Perks */}
          <ul className="space-y-2.5 mb-6">
            {PERKS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-3 w-3 text-emerald-600" />
                </div>
                <span className="text-sm text-gray-600">{text}</span>
              </li>
            ))}
          </ul>

          {/* Replit sign-in button */}
          <button
            onClick={handleSignIn}
            disabled={loading}
            data-testid="button-signin"
            className="w-full flex items-center justify-center gap-3 bg-[#F76C2F] hover:bg-[#E55E20] text-white rounded-xl px-5 py-3 text-sm font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4 text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <SiReplit className="h-4 w-4 text-white" />
            )}
            {loading ? "Redirecting…" : "Continue with Replit"}
          </button>

          <p className="text-center text-xs text-gray-400 mt-3">
            No password required · Instant access
          </p>

          {/* Cancel */}
          <button
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-signin"
            className="w-full mt-3 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Maybe later
          </button>

          <p className="text-center text-[11px] text-gray-300 mt-4 leading-relaxed">
            By continuing, you agree to our Terms and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
