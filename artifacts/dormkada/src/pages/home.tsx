import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetStatsSummary } from "@workspace/api-client-react";
import logoPath from "@assets/logo2.jpg";
import { ShieldCheck, Eye, Users, HomeIcon, Building, ArrowRight } from "lucide-react";

export default function Home() {
  const { data: stats } = useGetStatsSummary();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-600 to-blue-800 text-white overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-6 text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                Find Your Perfect <br/>
                <span className="text-amber-400">Dorm & Barkada</span>
              </h1>
              <p className="text-lg md:text-xl text-blue-100 max-w-xl mx-auto lg:mx-0">
                Discover verified, safe, and affordable boarding houses in Brgy. Tanza, Boac. Connecting students with trusted landlords.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold border-none"
                >
                  <Link href="/register">Get Started</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-transparent border-blue-400 text-blue-100 hover:bg-blue-800 hover:text-white"
                >
                  <Link href="/listings">Browse Listings</Link>
                </Button>
              </div>
            </div>
            
            <div className="hidden lg:flex justify-center">
              <div className="relative w-full max-w-md aspect-square rounded-full bg-blue-800/30 flex items-center justify-center p-12 backdrop-blur-sm border border-blue-500/20">
                <img 
                  src={logoPath} 
                  alt="DormKada Illustration" 
                  className="w-full h-full object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-slate-50 border-b py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <Card className="border-2 border-blue-300 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6 aspect-square flex flex-col items-center justify-center text-center">
                <p className="text-4xl lg:text-5xl font-extrabold text-blue-600 mb-3">{stats?.totalListings || 0}</p>
                <p className="text-sm lg:text-base text-slate-600 font-semibold uppercase tracking-wider">Total Listings</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-amber-300 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6 aspect-square flex flex-col items-center justify-center text-center">
                <p className="text-4xl lg:text-5xl font-extrabold text-amber-500 mb-3">{stats?.availableRooms || 0}</p>
                <p className="text-sm lg:text-base text-slate-600 font-semibold uppercase tracking-wider">Rooms Available</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-300 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6 aspect-square flex flex-col items-center justify-center text-center">
                <p className="text-4xl lg:text-5xl font-extrabold text-blue-600 mb-3">{stats?.totalRooms || 0}</p>
                <p className="text-sm lg:text-base text-slate-600 font-semibold uppercase tracking-wider">Total Rooms</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-emerald-300 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6 aspect-square flex flex-col items-center justify-center text-center">
                <p className="text-4xl lg:text-5xl font-extrabold text-emerald-500 mb-3">100%</p>
                <p className="text-sm lg:text-base text-slate-600 font-semibold uppercase tracking-wider">Verified</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Choose DormKada?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">We make finding student accommodation in Marinduque simple, safe, and transparent.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white border-none shadow-lg shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300">
              <CardContent className="p-8 text-center flex flex-col items-center">
                <div className="h-16 w-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Security First</h3>
                <p className="text-slate-600">All landlords and properties are verified by our team to ensure your safety and peace of mind.</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-none shadow-lg shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300">
              <CardContent className="p-8 text-center flex flex-col items-center">
                <div className="h-16 w-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-6">
                  <Eye className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Full Transparency</h3>
                <p className="text-slate-600">Clear pricing, realistic photos, and honest policies. No hidden fees or surprises.</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-none shadow-lg shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300">
              <CardContent className="p-8 text-center flex flex-col items-center">
                <div className="h-16 w-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Student Community</h3>
                <p className="text-slate-600">Built specifically for students of MarSU. Find dorms near campus and connect with your barkada.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white text-center">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to find your new home?</h2>
          <p className="text-blue-100 mb-10 text-lg">Browse our verified listings and reserve your spot today.</p>
          <Button
            asChild
            size="lg"
            className="bg-white text-blue-600 hover:bg-slate-100 font-bold px-8 h-14 text-lg border-none shadow-xl"
          >
            <Link href="/listings">
              Start Exploring <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
