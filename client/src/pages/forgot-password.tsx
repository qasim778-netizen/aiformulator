import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Lock, ShieldCheck, Send, Clock, ArrowLeft, Mail } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Reset Your Password | AIFormulator";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Reset your AIFormulator password to regain access to your account and saved formulations.");
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

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordFormData) =>
      apiRequest("POST", "/api/forgot-password", data),
    onSuccess: () => {
      toast({
        title: "Check your inbox",
        description: "If an account with that email exists, we've sent a secure password reset link. It expires in 30 minutes.",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Couldn't send reset link",
        description: error?.message || "Please try again in a moment.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPasswordMutation.mutate(data);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/60 overflow-hidden">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 w-[28rem] h-[28rem] bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-32 w-[32rem] h-[32rem] bg-teal-200/30 rounded-full blur-3xl" />
        {/* Subtle molecular dot pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#0D9488" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ─── LEFT: Headline + benefits ─────────────────────────── */}
          <div className="order-2 lg:order-1 max-w-md mx-auto lg:mx-0">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight tracking-tight">
              Reset Your<br />
              <span className="text-emerald-600">Password</span>
            </h1>
            <div className="mt-3 h-1 w-16 bg-emerald-500 rounded-full" />
            <p className="mt-6 text-base text-gray-600 leading-relaxed">
              Enter your email address and we'll send you a secure link to reset your password.
            </p>

            <ul className="mt-10 space-y-6">
              {[
                {
                  icon: ShieldCheck,
                  title: "Secure & Private",
                  desc: "Your data is encrypted and protected with enterprise-grade security.",
                },
                {
                  icon: Send,
                  title: "Instant Reset Link",
                  desc: "Receive a secure password reset link directly in your email inbox.",
                },
                {
                  icon: Clock,
                  title: "Time-Limited Link",
                  desc: "For your security, the link will expire in 30 minutes.",
                },
              ].map(({ icon: Icon, title, desc }) => (
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

          {/* ─── RIGHT: Reset card ─────────────────────────────────── */}
          <div className="order-1 lg:order-2 w-full max-w-md mx-auto">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 px-7 py-9 sm:px-10 sm:py-11">
              {/* Lock icon */}
              <div className="flex justify-center mb-5">
                <div className="h-16 w-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <Lock className="h-7 w-7 text-emerald-600" />
                </div>
              </div>

              {/* Heading */}
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight" data-testid="text-forgot-password-title">
                  Forgot Password?
                </h2>
                <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                  No worries! Enter your email address and we'll send you a secure link to reset it.
                </p>
              </div>

              <div className="my-7 h-px bg-gray-100" />

              {/* Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-800">Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <Input
                              type="email"
                              placeholder="Enter your email address"
                              className="pl-10 h-11 rounded-xl border-gray-200 focus-visible:ring-emerald-500"
                              {...field}
                              data-testid="input-email"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={forgotPasswordMutation.isPending}
                    className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-sm hover:shadow transition-all"
                    data-testid="button-reset-password"
                  >
                    {forgotPasswordMutation.isPending ? (
                      "Sending…"
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Reset Link
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400 font-medium">or</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Back to Sign In */}
              <Link href="/login">
                <button
                  type="button"
                  data-testid="link-login"
                  className="w-full h-12 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </button>
              </Link>

              {/* Security Tip */}
              <div className="mt-6 flex items-start gap-3 bg-emerald-50/70 border border-emerald-100 rounded-xl p-4">
                <ShieldCheck className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Security Tip</p>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    If you didn't request a password reset, you can safely ignore this email.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
