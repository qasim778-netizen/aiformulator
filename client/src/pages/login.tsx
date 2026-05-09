import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Mail, Lock, ShieldCheck, Cloud, Eye, FlaskConical, BookOpen, Award, BarChart3 } from "lucide-react";
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

  const handleSecureSignIn = () => {
    setLoading(true);
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* ─── LEFT: Branding & benefits ───────────────────────────────── */}
      <aside className="relative lg:w-1/2 px-6 py-10 sm:px-10 lg:px-14 lg:py-12 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/60 overflow-hidden flex items-center justify-center">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-20 w-[28rem] h-[28rem] bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-xl">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <img src={logoImage} alt="AIFormulator" className="h-12 w-auto object-contain" />
            <div>
              <p className="text-xl font-bold text-gray-900 leading-tight">AIFormulator</p>
              <p className="text-xs text-gray-500 leading-tight">Professional Formulation Intelligence</p>
            </div>
          </div>

          {/* Hero */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight tracking-tight">
            AI-Powered <br />
            Formula Development <br />
            Platform
          </h1>
          <p className="mt-5 text-base text-gray-600 max-w-md leading-relaxed">
            Create innovative, stable, and market-ready formulas faster with the power of AI and expert knowledge.
          </p>

          {/* Benefits */}
          <ul className="mt-9 space-y-5">
            {[
              { icon: FlaskConical, title: "AI-Assisted Formulation", desc: "Generate optimized formulas in minutes." },
              { icon: BookOpen,     title: "Extensive Ingredient Library", desc: "Access thousands of ingredients & actives." },
              { icon: Award,        title: "Industry-Grade Standards", desc: "Built for cosmetics, industrial & specialty products." },
              { icon: BarChart3,    title: "Save, Manage & Scale", desc: "Organize formulas and scale your innovation." },
            ].map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Stats strip */}
          <div className="mt-12 grid grid-cols-3 gap-3 bg-white/70 backdrop-blur-sm border border-gray-100 rounded-2xl p-5 shadow-sm">
            {[
              { num: "10,000+", label: "Active Users" },
              { num: "50,000+", label: "Formulas Generated" },
              { num: "50+",     label: "Product Categories" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-emerald-600">{s.num}</p>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ─── RIGHT: Login card ───────────────────────────────────────── */}
      <main className="lg:w-1/2 flex items-center justify-center px-6 py-10 sm:px-10 lg:px-14">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 px-7 py-9 sm:px-10 sm:py-11">
            <div className="flex justify-center mb-6">
              <img src={logoImage} alt="AIFormulator" className="h-16 w-auto object-contain" />
            </div>

            <div className="text-center mb-7">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Welcome to <span className="text-emerald-600">AIFormulator</span>
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Sign in to create, save, and manage your formulas
              </p>
            </div>

            {/* Continue Securely (Replit OAuth, branding hidden) */}
            <button
              onClick={handleSecureSignIn}
              disabled={loading}
              data-testid="button-continue-securely"
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-800 rounded-xl px-5 py-3.5 text-sm font-semibold shadow-sm hover:shadow transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              )}
              {loading ? "Redirecting…" : "Continue Securely"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 font-medium">or</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Continue with Email */}
            <Link href="/login/email">
              <button
                data-testid="button-continue-email"
                className="w-full flex items-center justify-center gap-2 border-2 border-emerald-500 text-emerald-700 rounded-xl px-5 py-3.5 text-sm font-semibold hover:bg-emerald-50 transition-colors"
              >
                <Mail className="h-4 w-4" />
                Continue with Email
              </button>
            </Link>

            {/* Sign up */}
            <p className="text-center text-sm text-gray-500 mt-5">
              Don't have an account?{" "}
              <Link href="/signup">
                <span className="text-emerald-600 font-semibold hover:underline cursor-pointer">Sign up</span>
              </Link>
            </p>

            {/* Trust badge */}
            <div className="mt-6 flex items-start gap-3 bg-emerald-50/70 border border-emerald-100 rounded-xl p-4">
              <Lock className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Secure & Trusted</p>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                  Your data is encrypted and secure with enterprise-grade protection.
                </p>
              </div>
            </div>
          </div>

          {/* Trust row */}
          <div className="mt-7 grid grid-cols-3 gap-3 text-center">
            {[
              { icon: ShieldCheck, title: "Secure Login", desc: "256-bit encryption" },
              { icon: Cloud,       title: "Cloud Saved",  desc: "Access anywhere" },
              { icon: Eye,         title: "Privacy First",desc: "Your data is safe" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center">
                <Icon className="h-5 w-5 text-emerald-600 mb-1.5" />
                <p className="text-xs font-semibold text-gray-800 leading-tight">{title}</p>
                <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{desc}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-400 mt-6 leading-relaxed">
            By continuing, you agree to our{" "}
            <Link href="/terms-of-service">
              <span className="text-emerald-600 hover:underline cursor-pointer">Terms of Service</span>
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy">
              <span className="text-emerald-600 hover:underline cursor-pointer">Privacy Policy</span>
            </Link>.
          </p>
        </div>
      </main>
    </div>
  );
}
