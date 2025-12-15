import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Login to Your Account | AIFormulator"
    // Set unique meta description for login page
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Log in to your AIFormulator account to access saved formulations and download professional chemical formulas.');
    }
    // Add noindex meta tag for auth pages
    let metaRobots = document.querySelector('meta[name="robots"]') as HTMLMetaElement
    if (!metaRobots) {
      metaRobots = document.createElement('meta')
      metaRobots.name = 'robots'
      document.head.appendChild(metaRobots)
    }
    metaRobots.content = 'noindex, follow'
    return () => {
      if (metaRobots) metaRobots.content = 'index, follow'
    }
  }, [])

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      return apiRequest('POST', '/api/login', data);
    },
    onSuccess: () => {
      toast({
        title: "Login successful!",
        description: "Welcome back to AIFormulator.",
      });
      
      // Get returnTo parameter from URL query string using window.location.search
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get('returnTo');
      
      // Redirect to returnTo if provided, otherwise go to my-account
      const redirectPath = returnTo ? decodeURIComponent(returnTo) : "/my-account";
      setLocation(redirectPath);
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-6">Login to Your Account</h1>
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-login-title">Log In</CardTitle>
            <CardDescription>
              Access your AIFormulator account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="john@example.com" 
                          {...field} 
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                          data-testid="input-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? "Logging in..." : "Log In"}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  <div className="mb-2">
                    Don't have an account?{" "}
                    <Link href="/signup">
                      <a className="text-primary hover:underline" data-testid="link-signup">
                        Sign up
                      </a>
                    </Link>
                  </div>
                  <Link href="/forgot-password">
                    <a className="text-primary hover:underline" data-testid="link-forgot-password">
                      Forgot password?
                    </a>
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
