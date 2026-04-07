import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useRegisterUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import logoNamePath from "@assets/logo_name_1775521822255.jpg";

const studentSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const ownerSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  idImageUrl: z.string().url("Please provide a valid image URL for ID verification"),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerUser = useRegisterUser();
  const [role, setRole] = useState<"student" | "owner">("student");

  const studentForm = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  const ownerForm = useForm<z.infer<typeof ownerSchema>>({
    resolver: zodResolver(ownerSchema),
    defaultValues: { fullName: "", email: "", password: "", idImageUrl: "" },
  });

  const onStudentSubmit = (data: z.infer<typeof studentSchema>) => {
    handleRegister({ ...data, role: "student" });
  };

  const onOwnerSubmit = (data: z.infer<typeof ownerSchema>) => {
    handleRegister({ ...data, role: "owner" });
  };

  const handleRegister = (data: any) => {
    registerUser.mutate(
      { data },
      {
        onSuccess: (res) => {
          localStorage.setItem("dormkada_token", res.token);
          toast({
            title: "Registration successful",
            description: "Welcome to DormKada!",
          });
          
          if (res.user.role === "owner") {
            setLocation("/owner");
          } else {
            setLocation("/dashboard");
          }
        },
        onError: (err: any) => {
          toast({
            title: "Registration failed",
            description: err.error || "An error occurred during registration",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center p-4 py-12 bg-slate-50">
      <Card className="w-full max-w-md shadow-xl shadow-blue-900/5 border-none">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center mb-4">
            <img src={logoNamePath} alt="DormKada" className="h-10" />
          </div>
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>Join our community to find or list a boarding house</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="student" onValueChange={(v) => setRole(v as "student" | "owner")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="student">Student</TabsTrigger>
              <TabsTrigger value="owner">Landlord</TabsTrigger>
            </TabsList>
            
            <TabsContent value="student">
              <Form {...studentForm}>
                <form onSubmit={studentForm.handleSubmit(onStudentSubmit)} className="space-y-4">
                  <FormField
                    control={studentForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Juan dela Cruz" {...field} data-testid="input-student-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={studentForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="juan@msc.edu.ph" {...field} data-testid="input-student-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={studentForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} data-testid="input-student-password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 mt-6" 
                    disabled={registerUser.isPending}
                    data-testid="button-register-student"
                  >
                    {registerUser.isPending && role === "student" ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering...</>
                    ) : "Sign Up as Student"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="owner">
              <Form {...ownerForm}>
                <form onSubmit={ownerForm.handleSubmit(onOwnerSubmit)} className="space-y-4">
                  <FormField
                    control={ownerForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Maria Santos" {...field} data-testid="input-owner-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={ownerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="maria@example.com" {...field} data-testid="input-owner-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={ownerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} data-testid="input-owner-password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={ownerForm.control}
                    name="idImageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valid ID Image URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/id.jpg" {...field} data-testid="input-owner-idurl" />
                        </FormControl>
                        <FormDescription className="text-xs text-slate-500">For verification purposes, provide a link to a valid ID.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 mt-6" 
                    disabled={registerUser.isPending}
                    data-testid="button-register-owner"
                  >
                    {registerUser.isPending && role === "owner" ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering...</>
                    ) : "Sign Up as Landlord"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="justify-center border-t pt-6 text-sm text-slate-500">
          Already have an account?{" "}
          <Button variant="link" className="px-1 text-blue-600" onClick={() => setLocation("/login")}>
            Log in
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
