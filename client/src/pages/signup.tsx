import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      country: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupFormData) => {
      return apiRequest('POST', '/api/signup', {
        firstName: data.firstName,
        lastName: data.lastName,
        country: data.country,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
    },
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

  const onSubmit = (data: SignupFormData) => {
    signupMutation.mutate(data);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-signup-title">Create Your Account</CardTitle>
            <CardDescription>
              Join AIFormulator to access professional chemical formulations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="John" 
                            {...field} 
                            data-testid="input-first-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Doe" 
                            {...field} 
                            data-testid="input-last-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-country">
                            <SelectValue placeholder="Select your country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Afghanistan">Afghanistan</SelectItem>
                          <SelectItem value="Albania">Albania</SelectItem>
                          <SelectItem value="Algeria">Algeria</SelectItem>
                          <SelectItem value="Andorra">Andorra</SelectItem>
                          <SelectItem value="Angola">Angola</SelectItem>
                          <SelectItem value="Argentina">Argentina</SelectItem>
                          <SelectItem value="Armenia">Armenia</SelectItem>
                          <SelectItem value="Australia">Australia</SelectItem>
                          <SelectItem value="Austria">Austria</SelectItem>
                          <SelectItem value="Azerbaijan">Azerbaijan</SelectItem>
                          <SelectItem value="Bahamas">Bahamas</SelectItem>
                          <SelectItem value="Bahrain">Bahrain</SelectItem>
                          <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                          <SelectItem value="Barbados">Barbados</SelectItem>
                          <SelectItem value="Belarus">Belarus</SelectItem>
                          <SelectItem value="Belgium">Belgium</SelectItem>
                          <SelectItem value="Belize">Belize</SelectItem>
                          <SelectItem value="Benin">Benin</SelectItem>
                          <SelectItem value="Bhutan">Bhutan</SelectItem>
                          <SelectItem value="Bolivia">Bolivia</SelectItem>
                          <SelectItem value="Bosnia and Herzegovina">Bosnia and Herzegovina</SelectItem>
                          <SelectItem value="Botswana">Botswana</SelectItem>
                          <SelectItem value="Brazil">Brazil</SelectItem>
                          <SelectItem value="Brunei">Brunei</SelectItem>
                          <SelectItem value="Bulgaria">Bulgaria</SelectItem>
                          <SelectItem value="Burkina Faso">Burkina Faso</SelectItem>
                          <SelectItem value="Burundi">Burundi</SelectItem>
                          <SelectItem value="Cambodia">Cambodia</SelectItem>
                          <SelectItem value="Cameroon">Cameroon</SelectItem>
                          <SelectItem value="Canada">Canada</SelectItem>
                          <SelectItem value="Cape Verde">Cape Verde</SelectItem>
                          <SelectItem value="Central African Republic">Central African Republic</SelectItem>
                          <SelectItem value="Chad">Chad</SelectItem>
                          <SelectItem value="Chile">Chile</SelectItem>
                          <SelectItem value="China">China</SelectItem>
                          <SelectItem value="Colombia">Colombia</SelectItem>
                          <SelectItem value="Comoros">Comoros</SelectItem>
                          <SelectItem value="Congo">Congo</SelectItem>
                          <SelectItem value="Costa Rica">Costa Rica</SelectItem>
                          <SelectItem value="Croatia">Croatia</SelectItem>
                          <SelectItem value="Cuba">Cuba</SelectItem>
                          <SelectItem value="Cyprus">Cyprus</SelectItem>
                          <SelectItem value="Czech Republic">Czech Republic</SelectItem>
                          <SelectItem value="Denmark">Denmark</SelectItem>
                          <SelectItem value="Djibouti">Djibouti</SelectItem>
                          <SelectItem value="Dominica">Dominica</SelectItem>
                          <SelectItem value="Dominican Republic">Dominican Republic</SelectItem>
                          <SelectItem value="Ecuador">Ecuador</SelectItem>
                          <SelectItem value="Egypt">Egypt</SelectItem>
                          <SelectItem value="El Salvador">El Salvador</SelectItem>
                          <SelectItem value="Equatorial Guinea">Equatorial Guinea</SelectItem>
                          <SelectItem value="Eritrea">Eritrea</SelectItem>
                          <SelectItem value="Estonia">Estonia</SelectItem>
                          <SelectItem value="Ethiopia">Ethiopia</SelectItem>
                          <SelectItem value="Fiji">Fiji</SelectItem>
                          <SelectItem value="Finland">Finland</SelectItem>
                          <SelectItem value="France">France</SelectItem>
                          <SelectItem value="Gabon">Gabon</SelectItem>
                          <SelectItem value="Gambia">Gambia</SelectItem>
                          <SelectItem value="Georgia">Georgia</SelectItem>
                          <SelectItem value="Germany">Germany</SelectItem>
                          <SelectItem value="Ghana">Ghana</SelectItem>
                          <SelectItem value="Greece">Greece</SelectItem>
                          <SelectItem value="Grenada">Grenada</SelectItem>
                          <SelectItem value="Guatemala">Guatemala</SelectItem>
                          <SelectItem value="Guinea">Guinea</SelectItem>
                          <SelectItem value="Guinea-Bissau">Guinea-Bissau</SelectItem>
                          <SelectItem value="Guyana">Guyana</SelectItem>
                          <SelectItem value="Haiti">Haiti</SelectItem>
                          <SelectItem value="Honduras">Honduras</SelectItem>
                          <SelectItem value="Hungary">Hungary</SelectItem>
                          <SelectItem value="Iceland">Iceland</SelectItem>
                          <SelectItem value="India">India</SelectItem>
                          <SelectItem value="Indonesia">Indonesia</SelectItem>
                          <SelectItem value="Iran">Iran</SelectItem>
                          <SelectItem value="Iraq">Iraq</SelectItem>
                          <SelectItem value="Ireland">Ireland</SelectItem>
                          <SelectItem value="Israel">Israel</SelectItem>
                          <SelectItem value="Italy">Italy</SelectItem>
                          <SelectItem value="Jamaica">Jamaica</SelectItem>
                          <SelectItem value="Japan">Japan</SelectItem>
                          <SelectItem value="Jordan">Jordan</SelectItem>
                          <SelectItem value="Kazakhstan">Kazakhstan</SelectItem>
                          <SelectItem value="Kenya">Kenya</SelectItem>
                          <SelectItem value="Kiribati">Kiribati</SelectItem>
                          <SelectItem value="Kuwait">Kuwait</SelectItem>
                          <SelectItem value="Kyrgyzstan">Kyrgyzstan</SelectItem>
                          <SelectItem value="Laos">Laos</SelectItem>
                          <SelectItem value="Latvia">Latvia</SelectItem>
                          <SelectItem value="Lebanon">Lebanon</SelectItem>
                          <SelectItem value="Lesotho">Lesotho</SelectItem>
                          <SelectItem value="Liberia">Liberia</SelectItem>
                          <SelectItem value="Libya">Libya</SelectItem>
                          <SelectItem value="Liechtenstein">Liechtenstein</SelectItem>
                          <SelectItem value="Lithuania">Lithuania</SelectItem>
                          <SelectItem value="Luxembourg">Luxembourg</SelectItem>
                          <SelectItem value="Madagascar">Madagascar</SelectItem>
                          <SelectItem value="Malawi">Malawi</SelectItem>
                          <SelectItem value="Malaysia">Malaysia</SelectItem>
                          <SelectItem value="Maldives">Maldives</SelectItem>
                          <SelectItem value="Mali">Mali</SelectItem>
                          <SelectItem value="Malta">Malta</SelectItem>
                          <SelectItem value="Marshall Islands">Marshall Islands</SelectItem>
                          <SelectItem value="Mauritania">Mauritania</SelectItem>
                          <SelectItem value="Mauritius">Mauritius</SelectItem>
                          <SelectItem value="Mexico">Mexico</SelectItem>
                          <SelectItem value="Micronesia">Micronesia</SelectItem>
                          <SelectItem value="Moldova">Moldova</SelectItem>
                          <SelectItem value="Monaco">Monaco</SelectItem>
                          <SelectItem value="Mongolia">Mongolia</SelectItem>
                          <SelectItem value="Montenegro">Montenegro</SelectItem>
                          <SelectItem value="Morocco">Morocco</SelectItem>
                          <SelectItem value="Mozambique">Mozambique</SelectItem>
                          <SelectItem value="Myanmar">Myanmar</SelectItem>
                          <SelectItem value="Namibia">Namibia</SelectItem>
                          <SelectItem value="Nauru">Nauru</SelectItem>
                          <SelectItem value="Nepal">Nepal</SelectItem>
                          <SelectItem value="Netherlands">Netherlands</SelectItem>
                          <SelectItem value="New Zealand">New Zealand</SelectItem>
                          <SelectItem value="Nicaragua">Nicaragua</SelectItem>
                          <SelectItem value="Niger">Niger</SelectItem>
                          <SelectItem value="Nigeria">Nigeria</SelectItem>
                          <SelectItem value="North Korea">North Korea</SelectItem>
                          <SelectItem value="North Macedonia">North Macedonia</SelectItem>
                          <SelectItem value="Norway">Norway</SelectItem>
                          <SelectItem value="Oman">Oman</SelectItem>
                          <SelectItem value="Pakistan">Pakistan</SelectItem>
                          <SelectItem value="Palau">Palau</SelectItem>
                          <SelectItem value="Palestine">Palestine</SelectItem>
                          <SelectItem value="Panama">Panama</SelectItem>
                          <SelectItem value="Papua New Guinea">Papua New Guinea</SelectItem>
                          <SelectItem value="Paraguay">Paraguay</SelectItem>
                          <SelectItem value="Peru">Peru</SelectItem>
                          <SelectItem value="Philippines">Philippines</SelectItem>
                          <SelectItem value="Poland">Poland</SelectItem>
                          <SelectItem value="Portugal">Portugal</SelectItem>
                          <SelectItem value="Qatar">Qatar</SelectItem>
                          <SelectItem value="Romania">Romania</SelectItem>
                          <SelectItem value="Russia">Russia</SelectItem>
                          <SelectItem value="Rwanda">Rwanda</SelectItem>
                          <SelectItem value="Saint Kitts and Nevis">Saint Kitts and Nevis</SelectItem>
                          <SelectItem value="Saint Lucia">Saint Lucia</SelectItem>
                          <SelectItem value="Saint Vincent and the Grenadines">Saint Vincent and the Grenadines</SelectItem>
                          <SelectItem value="Samoa">Samoa</SelectItem>
                          <SelectItem value="San Marino">San Marino</SelectItem>
                          <SelectItem value="Sao Tome and Principe">Sao Tome and Principe</SelectItem>
                          <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                          <SelectItem value="Senegal">Senegal</SelectItem>
                          <SelectItem value="Serbia">Serbia</SelectItem>
                          <SelectItem value="Seychelles">Seychelles</SelectItem>
                          <SelectItem value="Sierra Leone">Sierra Leone</SelectItem>
                          <SelectItem value="Singapore">Singapore</SelectItem>
                          <SelectItem value="Slovakia">Slovakia</SelectItem>
                          <SelectItem value="Slovenia">Slovenia</SelectItem>
                          <SelectItem value="Solomon Islands">Solomon Islands</SelectItem>
                          <SelectItem value="Somalia">Somalia</SelectItem>
                          <SelectItem value="South Africa">South Africa</SelectItem>
                          <SelectItem value="South Korea">South Korea</SelectItem>
                          <SelectItem value="South Sudan">South Sudan</SelectItem>
                          <SelectItem value="Spain">Spain</SelectItem>
                          <SelectItem value="Sri Lanka">Sri Lanka</SelectItem>
                          <SelectItem value="Sudan">Sudan</SelectItem>
                          <SelectItem value="Suriname">Suriname</SelectItem>
                          <SelectItem value="Sweden">Sweden</SelectItem>
                          <SelectItem value="Switzerland">Switzerland</SelectItem>
                          <SelectItem value="Syria">Syria</SelectItem>
                          <SelectItem value="Taiwan">Taiwan</SelectItem>
                          <SelectItem value="Tajikistan">Tajikistan</SelectItem>
                          <SelectItem value="Tanzania">Tanzania</SelectItem>
                          <SelectItem value="Thailand">Thailand</SelectItem>
                          <SelectItem value="Timor-Leste">Timor-Leste</SelectItem>
                          <SelectItem value="Togo">Togo</SelectItem>
                          <SelectItem value="Tonga">Tonga</SelectItem>
                          <SelectItem value="Trinidad and Tobago">Trinidad and Tobago</SelectItem>
                          <SelectItem value="Tunisia">Tunisia</SelectItem>
                          <SelectItem value="Turkey">Turkey</SelectItem>
                          <SelectItem value="Turkmenistan">Turkmenistan</SelectItem>
                          <SelectItem value="Tuvalu">Tuvalu</SelectItem>
                          <SelectItem value="Uganda">Uganda</SelectItem>
                          <SelectItem value="Ukraine">Ukraine</SelectItem>
                          <SelectItem value="United Arab Emirates">United Arab Emirates</SelectItem>
                          <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                          <SelectItem value="United States">United States</SelectItem>
                          <SelectItem value="Uruguay">Uruguay</SelectItem>
                          <SelectItem value="Uzbekistan">Uzbekistan</SelectItem>
                          <SelectItem value="Vanuatu">Vanuatu</SelectItem>
                          <SelectItem value="Vatican City">Vatican City</SelectItem>
                          <SelectItem value="Venezuela">Venezuela</SelectItem>
                          <SelectItem value="Vietnam">Vietnam</SelectItem>
                          <SelectItem value="Yemen">Yemen</SelectItem>
                          <SelectItem value="Zambia">Zambia</SelectItem>
                          <SelectItem value="Zimbabwe">Zimbabwe</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                          data-testid="input-confirm-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={signupMutation.isPending}
                  data-testid="button-signup"
                >
                  {signupMutation.isPending ? "Creating Account..." : "Create Account"}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary hover:underline" data-testid="link-login">
                    Log in
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
