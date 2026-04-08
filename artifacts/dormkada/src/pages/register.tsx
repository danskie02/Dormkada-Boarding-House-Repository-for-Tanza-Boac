import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useRegisterUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import logoNamePath from "@assets/logo_name2.jpg";

const studentSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const ownerSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  idImageUrl: z.string().min(1, "Please upload a valid ID image"),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerUser = useRegisterUser();
  const [role, setRole] = useState<"student" | "owner">("student");
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<any>(null);
  const [idPreview, setIdPreview] = useState<string>("");

  const studentForm = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  const ownerForm = useForm<z.infer<typeof ownerSchema>>({
    resolver: zodResolver(ownerSchema),
    defaultValues: { fullName: "", email: "", password: "", idImageUrl: "" },
  });

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle ID file upload
  const handleIdFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const file = files[0];
      // Validate file is an image
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file",
          description: "Please upload an image file.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      const base64 = await fileToBase64(file);
      ownerForm.setValue("idImageUrl", base64);
      setIdPreview(base64);
      toast({ title: "ID image uploaded successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process the image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onStudentSubmit = (data: z.infer<typeof studentSchema>) => {
    setPendingSubmit({ ...data, role: "student" });
    setShowTermsModal(true);
  };

  const onOwnerSubmit = (data: z.infer<typeof ownerSchema>) => {
    setPendingSubmit({ ...data, role: "owner" });
    setShowTermsModal(true);
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

  const handleTermsAccept = () => {
    if (!termsAccepted) {
      toast({
        title: "Please accept",
        description: "You must accept the terms and policies to continue.",
        variant: "destructive",
      });
      return;
    }

    setShowTermsModal(false);
    handleRegister(pendingSubmit);
    setTermsAccepted(false);
    setPendingSubmit(null);
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
                          <Input placeholder="juan@marsu.edu.ph" {...field} data-testid="input-student-email" />
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
                        <FormLabel>Valid ID Image</FormLabel>
                        <FormControl>
                          <div className="space-y-3">
                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-amber-500 transition-colors">
                              <Upload className="h-6 w-6 mx-auto text-slate-400 mb-2" />
                              <p className="text-xs text-slate-500 mb-2">Click to upload your valid ID (JPG, PNG, etc.)</p>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleIdFileUpload}
                                className="hidden"
                                id="id-upload"
                              />
                              <label htmlFor="id-upload" className="cursor-pointer">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="text-amber-600 border-amber-200 hover:bg-amber-50"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    document.getElementById("id-upload")?.click();
                                  }}
                                >
                                  <Upload className="h-3 w-3 mr-1" /> Choose File
                                </Button>
                              </label>
                            </div>

                            {/* ID Preview */}
                            {idPreview && (
                              <div className="relative">
                                <img
                                  src={idPreview}
                                  alt="ID Preview"
                                  className="w-full h-32 object-cover rounded border border-slate-200"
                                />
                                <p className="text-xs text-green-600 mt-2">✓ ID image uploaded</p>
                              </div>
                            )}

                            <input type="hidden" {...field} />
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs text-slate-500">For verification purposes, Upload a clear photo of your valid ID.</FormDescription>
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

      {/* Terms and Policies Modal */}
      <AlertDialog open={showTermsModal} onOpenChange={setShowTermsModal}>
        <AlertDialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Terms and Policies</AlertDialogTitle>
            <AlertDialogDescription>
              Please read and accept our terms and policies before continuing
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 text-sm text-slate-700">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">📋 Data Privacy Act of 2012</h3>
              <p className="text-blue-800 text-xs leading-relaxed">
                In compliance with the Data Privacy Act of 2012 (Republic Act No. 10173), DormKada is committed to protecting your personal data and privacy. We collect, process, and maintain your information in accordance with this law to provide you with safe, reliable, and quality service.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-2">1. Information We Collect</h4>
              <p className="text-xs leading-relaxed">
                We collect personal information including your full name, email address, password, and for landlords/owners, a valid ID image for verification purposes. This information is used solely to establish and maintain your account.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-2">2. Use of Information</h4>
              <p className="text-xs leading-relaxed">
                Your personal data will only be used for account creation, communication, and service provision. We will never share your information with third parties without your explicit consent, except as required by law.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-2">3. Data Security</h4>
              <p className="text-xs leading-relaxed">
                We implement industry-standard security measures to protect your personal data from unauthorized access, alteration, disclosure, or destruction. Your data is stored securely and accessed only by authorized personnel.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-2">4. Your Rights</h4>
              <p className="text-xs leading-relaxed">
                You have the right to access, rectify, and request deletion of your personal data. You may also withdraw consent at any time. For data-related concerns, please contact our Data Protection Officer.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-2">5. Contact Us</h4>
              <p className="text-xs leading-relaxed">
                If you have any questions or concerns about our privacy practices or the Data Privacy Act of 2012, please contact us at support@dormkada.com.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-semibold text-amber-900 mb-3">Acceptance</h4>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms-accept"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                  className="mt-1"
                />
                <label htmlFor="terms-accept" className="text-xs cursor-pointer text-amber-900">
                  I have read and understood the Terms and Policies, including the Data Privacy Act of 2012 compliance statement. I consent to the collection, processing, and use of my personal data as described above.
                </label>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowTermsModal(false);
              setTermsAccepted(false);
              setPendingSubmit(null);
            }}>
              Decline
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTermsAccept}
              disabled={!termsAccepted || registerUser.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {registerUser.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Accepting...</>
              ) : (
                "Accept and Continue"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
