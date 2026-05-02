import { useEffect, useState } from "react";
import { Link } from "wouter";
import { SiGoogle } from "react-icons/si";
import logoImage from "@assets/logo_1756133481367.png";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Sign In | AIFormulator";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Sign in to AIFormulator to create, save, and manage your professional chemical formulations.");
    }
    let metaRobots = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (!metaRobots) {
      metaRobots = document.createElement("meta");
      metaRobots.name = "robots";
      document.head.appendChild(metaRobots);
    }
    metaRobots.content = "noindex, follow";
    return () => { if (metaRobots) metaRobots.content = "index, follow"; };
  }, []);

  const handleGoogleSignIn = () => {
    setLoading(true);
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center px-4 py-12">

      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-100 rounded-full opacity-30 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-100 rounded-full opacity-30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 px-8 py-10 sm:px-10">

          {/* Logo */}
          <div className="flex justify-center mb-7">
            <img
              src={logoImage}
              alt="AIFormulator Logo"
              className="h-14 w-auto object-contain"
            />
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Welcome to AIFormulator
            </h1>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              Sign in to create, save, and manage your formulas
            </p>
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-xl px-6 py-3.5 text-sm font-semibold text-gray-700 shadow-sm hover:shadow-md hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <SiGoogle className="h-5 w-5 text-[#4285F4]" />
            )}
            {loading ? "Redirecting…" : "Continue with Google"}
          </button>

          {/* No password note */}
          <p className="text-center text-xs text-gray-400 mt-3">
            No password required
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-300 font-medium">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Email fallback (for existing accounts) */}
          <Link href="/login/email">
            <button className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-xl px-6 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
              Continue with Email
            </button>
          </Link>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-7 leading-relaxed">
            By continuing, you agree to our{" "}
            <Link href="/terms-of-service">
              <span className="text-teal-600 hover:underline cursor-pointer">Terms</span>
            </Link>
            {" "}and{" "}
            <Link href="/privacy-policy">
              <span className="text-teal-600 hover:underline cursor-pointer">Privacy Policy</span>
            </Link>
          </p>
        </div>

        {/* Below card */}
        <p className="text-center text-xs text-gray-400 mt-5">
          New to AIFormulator?{" "}
          <span className="text-teal-600 font-medium">
            Your account is created automatically on first sign-in.
          </span>
        </p>
      </div>
    </div>
  );
}
