import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Mail, Lock, Eye, EyeOff, ArrowRight,
  ShieldCheck, Cloud, Sparkles, KeyRound, Hourglass,
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import logoImage from "@assets/logo_1756133481367.png";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginEmailPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    document.title = "Sign In with Email | AIFormulator";
    let metaRobots = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (!metaRobots) {
      metaRobots = document.createElement("meta");
      metaRobots.name = "robots";
      document.head.appendChild(metaRobots);
    }
    metaRobots.content = "noindex, follow";
    return () => { if (metaRobots) metaRobots.content = "index, follow"; };
  }, []);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) => apiRequest("POST", "/api/login", data),
    onSuccess: () => {
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get("returnTo");
      setLocation(returnTo ? decodeURIComponent(returnTo) : "/my-account");
      window.location.reload();
    },
    onError: (error: any) => {
      toast({ title: "Login failed", description: error.message || "Invalid email or password.", variant: "destructive" });
    },
  });

  const trustBadges = [
    { icon: ShieldCheck, title: "256-bit Encryption", desc: "Your data is always safe" },
    { icon: Cloud, title: "Cloud Backed", desc: "Access anywhere" },
    { icon: Hourglass, title: "Trusted by Professionals", desc: "Across 50+ countries" },
    { icon: KeyRound, title: "Privacy First", desc: "We respect your privacy" },
  ];

  const benefits = [
    { icon: ShieldCheck, title: "Secure & Private", desc: "Enterprise-grade security keeps your data safe and protected." },
    { icon: Cloud, title: "Cloud Sync", desc: "Access your formulas and data anytime, anywhere." },
    { icon: Sparkles, title: "AI-Powered Insights", desc: "Save time and create better formulas with AI intelligence." },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/60 overflow-hidden">
      {/* ── Decorative background ───────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-32 w-[36rem] h-[36rem] bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-48 -right-40 w-[40rem] h-[40rem] bg-teal-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-cyan-100/20 rounded-full blur-3xl" />
        {/* Molecular dot pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="login-dots" width="36" height="36" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#0D9488" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-dots)" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── LEFT: Welcome + benefits ─────────────────── */}
          <div className="order-2 lg:order-1 max-w-md mx-auto lg:mx-0">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight tracking-tight">
              Welcome Back!<br />
              <span className="text-emerald-600">Smarter</span> Formulation<br />
              Starts Here.
            </h1>
            <div className="mt-3 h-1 w-16 bg-emerald-500 rounded-full" />
            <p className="mt-6 text-base text-gray-600 leading-relaxed">
              Sign in to access your formulas, collections, and AI-powered formulation tools.
            </p>

            <ul className="mt-10 space-y-6">
              {benefits.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex gap-4">
                  <div className="h-11 w-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{title}</p>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* ── RIGHT: Auth card (glassmorphism) ─────────── */}
          <div className="order-1 lg:order-2 w-full max-w-md mx-auto">
            <div className="relative">
              {/* glass shimmer behind */}
              <div className="absolute inset-0 -m-1 rounded-3xl bg-gradient-to-br from-white/60 to-emerald-100/40 blur-xl opacity-70" />

              <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 ring-1 ring-emerald-100/40 px-7 py-8 sm:px-10 sm:py-10">
                {/* Logo */}
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-white shadow-md ring-1 ring-gray-100 flex items-center justify-center overflow-hidden">
                    <img src={logoImage} alt="AIFormulator" className="h-12 w-12 object-contain" />
                  </div>
                </div>

                {/* Mail badge + heading */}
                <div className="text-center">
                  <div className="inline-flex h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 items-center justify-center mb-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                  </div>
                  <h2 className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight">
                    Sign in with email
                  </h2>
                  <p className="mt-1.5 text-sm text-gray-500">
                    For existing accounts with a password
                  </p>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(d => loginMutation.mutate(d))} className="space-y-4 mt-7">
                    {/* Email */}
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-800">Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              autoComplete="email"
                              className="pl-10 h-11 rounded-xl border-gray-200 bg-white focus-visible:ring-emerald-500 focus-visible:ring-offset-0"
                              {...field}
                              data-testid="input-email"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Password */}
                    <FormField control={form.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-800">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              autoComplete="current-password"
                              className="pl-10 pr-10 h-11 rounded-xl border-gray-200 bg-white focus-visible:ring-emerald-500 focus-visible:ring-offset-0"
                              {...field}
                              data-testid="input-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(s => !s)}
                              tabIndex={-1}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Remember + Forgot */}
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <Checkbox
                          checked={remember}
                          onCheckedChange={v => setRemember(v === true)}
                          className="h-4 w-4 rounded border-gray-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                          data-testid="checkbox-remember"
                        />
                        <span className="text-sm text-gray-600">Remember me</span>
                      </label>
                      <Link href="/forgot-password">
                        <span className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer" data-testid="link-forgot-password">
                          Forgot password?
                        </span>
                      </Link>
                    </div>

                    {/* Sign In */}
                    <Button
                      type="submit"
                      disabled={loginMutation.isPending}
                      className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                      data-testid="button-sign-in"
                    >
                      {loginMutation.isPending ? "Signing in…" : (
                        <>
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Sign In
                        </>
                      )}
                    </Button>
                  </form>
                </Form>

                {/* Divider */}
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400 font-medium">or</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                {/* Continue with Google */}
                <button
                  type="button"
                  onClick={() => (window.location.href = "/api/login")}
                  className="group w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-800 rounded-xl h-12 px-5 text-sm font-semibold shadow-sm hover:shadow transition-all"
                  data-testid="button-continue-google"
                >
                  <FcGoogle className="h-5 w-5" />
                  <span>Continue with Google</span>
                </button>

                {/* Legal */}
                <p className="text-center text-xs text-gray-400 mt-6 leading-relaxed">
                  By continuing, you agree to our{" "}
                  <Link href="/terms-of-service"><span className="text-emerald-600 hover:underline cursor-pointer">Terms</span></Link>
                  {" "}and{" "}
                  <Link href="/privacy-policy"><span className="text-emerald-600 hover:underline cursor-pointer">Privacy Policy</span></Link>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Trust indicators ─────────────────────────── */}
        <div className="relative mt-14 lg:mt-20">
          <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl shadow-sm px-6 py-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {trustBadges.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
                    <p className="text-xs text-gray-500 truncate">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
