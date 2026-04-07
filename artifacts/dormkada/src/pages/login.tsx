import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLoginUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import logoNamePath from "@assets/logo_name_1775521822255.jpg";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginUser = useLoginUser();
  const queryClient = useQueryClient();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginUser.mutate(
      { data },
      {
        onSuccess: async (res) => {
          localStorage.setItem("dormkada_token", res.token);
          await queryClient.resetQueries();

          if (res.user.role === "admin") {
            setLocation("/admin");
          } else if (res.user.role === "owner") {
            setLocation("/owner");
          } else {
            setLocation("/dashboard");
          }
        },
        onError: (err: any) => {
          toast({
            title: "Login failed",
            description: err.error || "An error occurred during login",
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
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="student@msc.edu.ph" {...field} data-testid="input-email" />
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
                      <Input type="password" placeholder="••••••••" {...field} data-testid="input-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                disabled={loginUser.isPending}
                data-testid="button-login"
              >
                {loginUser.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Log in"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center border-t pt-6 text-sm text-slate-500">
          Don't have an account?{" "}
          <Button variant="link" className="px-1 text-blue-600" onClick={() => setLocation("/register")}>
            Sign up
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
