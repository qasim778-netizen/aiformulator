import { useEffect } from "react";
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
import { SiReplit } from "react-icons/si";
import { Mail } from "lucide-react";
import logoImage from "@assets/logo_1756133481367.png";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginEmailPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-100 rounded-full opacity-30 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-100 rounded-full opacity-30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 px-8 py-10 sm:px-10">
          <div className="flex justify-center mb-7">
            <img src={logoImage} alt="AIFormulator Logo" className="h-14 w-auto object-contain" />
          </div>

          <div className="text-center mb-8">
            <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-3">
              <Mail className="h-5 w-5 text-gray-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sign in with email</h1>
            <p className="mt-1.5 text-sm text-gray-500">For existing accounts with a password</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(d => loginMutation.mutate(d))} className="space-y-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" className="h-11 rounded-xl border-gray-200" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" className="h-11 rounded-xl border-gray-200" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button type="submit" disabled={loginMutation.isPending}
                className="w-full h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold">
                {loginMutation.isPending ? "Signing in…" : "Sign In"}
              </Button>
            </form>
          </Form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-300 font-medium">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <button onClick={() => window.location.href = "/api/login"}
            className="w-full flex items-center justify-center gap-3 bg-[#F76C2F] hover:bg-[#E55E20] text-white rounded-xl px-5 py-3 text-sm font-semibold shadow-sm hover:shadow-md transition-all">
            <SiReplit className="h-4 w-4 text-white" />
            Continue with Replit instead
          </button>

          <div className="text-center mt-5 space-y-2">
            <Link href="/forgot-password">
              <span className="text-sm text-teal-600 hover:underline cursor-pointer">Forgot your password?</span>
            </Link>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6 leading-relaxed">
            By continuing, you agree to our{" "}
            <Link href="/terms-of-service"><span className="text-teal-600 hover:underline cursor-pointer">Terms</span></Link>
            {" "}and{" "}
            <Link href="/privacy-policy"><span className="text-teal-600 hover:underline cursor-pointer">Privacy Policy</span></Link>
          </p>
        </div>
      </div>
    </div>
  );
}
