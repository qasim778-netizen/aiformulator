import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react";
import Breadcrumb from "@/components/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(20, "Message must be at least 20 characters"),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  const mutation = useMutation({
    mutationFn: (data: ContactForm) =>
      apiRequest("POST", "/api/contact", data),
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: () => {
      toast({
        title: "Failed to send message",
        description: "Please try again or email us directly at support@aiformulator.net",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactForm) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F5F2" }}>
      <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Contact Us" }]} />
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ color: "#1A1A1A" }}>Contact Us</h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Have a question or need help? We'd love to hear from you. Send us a message and we'll get back to you as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Info Cards */}
          <div className="space-y-4">
            <Card className="border border-gray-200">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#E6F7F5" }}>
                  <Mail className="w-5 h-5" style={{ color: "#0D9488" }} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Email Us</h3>
                  <a href="mailto:support@aiformulator.net" className="text-sm text-gray-600 hover:text-teal-600 transition-colors">
                    support@aiformulator.net
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#E6F7F5" }}>
                  <CheckCircle className="w-5 h-5" style={{ color: "#0D9488" }} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Response Time</h3>
                  <p className="text-sm text-gray-600">We typically respond within 24–48 hours on business days.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#E6F7F5" }}>
                  <MapPin className="w-5 h-5" style={{ color: "#0D9488" }} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Based Online</h3>
                  <p className="text-sm text-gray-600">Serving chemical formulators and manufacturers worldwide.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="border border-gray-200">
              <CardContent className="p-8">
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4" style={{ backgroundColor: "#E6F7F5" }}>
                      <CheckCircle className="w-8 h-8" style={{ color: "#0D9488" }} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h2>
                    <p className="text-gray-600 mb-6">
                      Thanks for reaching out. We'll get back to you at <strong>{form.getValues("email")}</strong> within 24–48 hours.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => { setSubmitted(false); form.reset(); }}
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Send a Message</h2>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="you@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subject</FormLabel>
                              <FormControl>
                                <Input placeholder="What is this regarding?" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Message</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Tell us how we can help you..."
                                  rows={6}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          disabled={mutation.isPending}
                          className="w-full text-white font-semibold h-11"
                          style={{ backgroundColor: "#0D9488" }}
                        >
                          {mutation.isPending ? (
                            "Sending…"
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Send Message
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
