import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  User, Mail, Lock, Globe, Eye, EyeOff, UserPlus,
  ShieldCheck, FlaskConical, Cloud, Sparkles, KeyRound, Hourglass,
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia","Austria","Azerbaijan",
  "Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia",
  "Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Canada",
  "Cape Verde","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica","Croatia",
  "Cuba","Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador",
  "Equatorial Guinea","Eritrea","Estonia","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia",
  "Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras",
  "Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica",
  "Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon",
  "Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives",
  "Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia",
  "Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua",
  "Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palau","Palestine","Panama",
  "Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda",
  "Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe",
  "Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia",
  "South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria",
  "Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey",
  "Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu",
  "Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
];

const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  country: z.string().min(1, "Please select your country"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    document.title = "Create an Account | AIFormulator";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Create your free AIFormulator account to save formulations and download professional chemical manufacturing guides.");
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

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { firstName: "", lastName: "", country: "", email: "", password: "", confirmPassword: "" },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupFormData) =>
      apiRequest("POST", "/api/signup", data),
    onSuccess: () => {
      toast({
        title: "Account created successfully!",
        description: "Welcome to AIFormulator. You're now logged in.",
      });
      setLocation("/my-account");
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Signup failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const benefits = [
    { icon: ShieldCheck, title: "Secure & Private", desc: "Your data is encrypted and protected with enterprise-grade security." },
    { icon: FlaskConical, title: "Professional Tools", desc: "Advanced formulation tools designed for professionals and innovators." },
    { icon: Cloud, title: "Cloud Sync", desc: "Access your formulations from anywhere, anytime." },
    { icon: Sparkles, title: "AI-Powered Insights", desc: "Save time and create better formulas with AI intelligence." },
  ];

  const trustBadges = [
    { icon: ShieldCheck, title: "256-bit Encryption", desc: "Your data is always safe" },
    { icon: Cloud, title: "Cloud Backed", desc: "Access anywhere" },
    { icon: Hourglass, title: "Trusted by Professionals", desc: "Across 50+ countries" },
    { icon: KeyRound, title: "Privacy First", desc: "We respect your privacy" },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/60 overflow-hidden">
      {/* ── Decorative background ───────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-32 w-[36rem] h-[36rem] bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-48 -right-40 w-[40rem] h-[40rem] bg-teal-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-cyan-100/20 rounded-full blur-3xl" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="signup-dots" width="36" height="36" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#0D9488" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#signup-dots)" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">

          {/* ── LEFT: Branding + benefits ───────────────────── */}
          <div className="order-2 lg:order-1 max-w-md mx-auto lg:mx-0 lg:pt-8">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
              Join AIFormulator
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl font-bold text-gray-900 leading-tight tracking-tight">
              Create your account<br />
              and start <span className="text-emerald-600">innovating</span><br />
              smarter.
            </h1>
            <div className="mt-3 h-1 w-16 bg-emerald-500 rounded-full" />
            <p className="mt-6 text-base text-gray-600 leading-relaxed">
              Access professional-grade formulation tools, thousands of ingredients, and AI-powered insights — all in one place.
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

          {/* ── RIGHT: Signup card ─────────────────────────── */}
          <div className="order-1 lg:order-2 w-full max-w-md mx-auto lg:max-w-lg">
            <div className="relative">
              <div className="absolute inset-0 -m-1 rounded-3xl bg-gradient-to-br from-white/60 to-emerald-100/40 blur-xl opacity-70" />

              <div className="relative bg-white/85 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 ring-1 ring-emerald-100/40 px-7 py-8 sm:px-10 sm:py-10">
                {/* Avatar */}
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    <UserPlus className="h-7 w-7 text-emerald-600" />
                  </div>
                </div>

                <div className="text-center mb-7">
                  <h2 className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight" data-testid="text-signup-title">
                    Create Your Account
                  </h2>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                    Join AIFormulator to access professional chemical formulations.
                  </p>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit((d) => signupMutation.mutate(d))} className="space-y-4">
                    {/* First / Last name */}
                    <div className="grid grid-cols-2 gap-3">
                      <FormField control={form.control} name="firstName" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-gray-800">First Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                              <Input
                                placeholder="First name"
                                autoComplete="given-name"
                                className="pl-10 h-11 rounded-xl border-gray-200 bg-white focus-visible:ring-emerald-500 focus-visible:ring-offset-0"
                                {...field}
                                data-testid="input-first-name"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="lastName" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-gray-800">Last Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                              <Input
                                placeholder="Last name"
                                autoComplete="family-name"
                                className="pl-10 h-11 rounded-xl border-gray-200 bg-white focus-visible:ring-emerald-500 focus-visible:ring-offset-0"
                                {...field}
                                data-testid="input-last-name"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    {/* Country */}
                    <FormField control={form.control} name="country" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-800">Country</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger
                              className="pl-10 h-11 rounded-xl border-gray-200 bg-white focus:ring-emerald-500 focus:ring-offset-0 relative"
                              data-testid="select-country"
                            >
                              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                              <SelectValue placeholder="Select your country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-72">
                            {COUNTRIES.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Email */}
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-800">Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <Input
                              type="email"
                              placeholder="Enter your email address"
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
                              placeholder="Create a strong password"
                              autoComplete="new-password"
                              className="pl-10 pr-10 h-11 rounded-xl border-gray-200 bg-white focus-visible:ring-emerald-500 focus-visible:ring-offset-0"
                              {...field}
                              data-testid="input-password"
                            />
                            <button
                              type="button"
                              tabIndex={-1}
                              onClick={() => setShowPassword((s) => !s)}
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

                    {/* Confirm Password */}
                    <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-800">Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <Input
                              type={showConfirm ? "text" : "password"}
                              placeholder="Confirm your password"
                              autoComplete="new-password"
                              className="pl-10 pr-10 h-11 rounded-xl border-gray-200 bg-white focus-visible:ring-emerald-500 focus-visible:ring-offset-0"
                              {...field}
                              data-testid="input-confirm-password"
                            />
                            <button
                              type="button"
                              tabIndex={-1}
                              onClick={() => setShowConfirm((s) => !s)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              aria-label={showConfirm ? "Hide password" : "Show password"}
                            >
                              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Create Account button */}
                    <Button
                      type="submit"
                      disabled={signupMutation.isPending}
                      className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all mt-2"
                      data-testid="button-signup"
                    >
                      {signupMutation.isPending ? "Creating Account…" : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Create Account
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
                  onClick={() => (window.location.href = "/api/auth/google")}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-800 rounded-xl h-12 px-5 text-sm font-semibold shadow-sm hover:shadow transition-all"
                  data-testid="button-continue-google"
                >
                  <FcGoogle className="h-5 w-5" />
                  <span>Continue with Google</span>
                </button>

                {/* Already have account */}
                <p className="text-center text-sm text-gray-500 mt-6">
                  Already have an account?{" "}
                  <Link href="/login">
                    <span className="text-emerald-600 hover:text-emerald-700 hover:underline font-semibold cursor-pointer" data-testid="link-login">
                      Log in
                    </span>
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Trust indicators ───────────────────────────── */}
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
