import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, ShieldCheck, Users } from "lucide-react";

export default function About() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <section className="bg-white border-b py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">
            About DormKada
          </h1>
          <p className="mt-3 text-slate-600 max-w-2xl">
            DormKada is a centralized reservation and rental platform that helps
            students find verified boarding houses in Brgy. Tanza. Now faster, more accessible
            with clearer information and real-time availability.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Verified & Secure
                    </h2>
                    <p className="mt-1 text-slate-600">
                      Owner and listing verification helps reduce uncertainty and
                      improves safety for students.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Smart Reservation Flow
                    </h2>
                    <p className="mt-1 text-slate-600">
                      Reservation requests use a 24-hour pending window and
                      update status so you know what’s next.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Map-Based Discovery
                    </h2>
                    <p className="mt-1 text-slate-600">
                      Explore approved listings on an interactive map centered
                      on Brgy. Tanza.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-slate-700" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Built for Students & Owners
                    </h2>
                    <p className="mt-1 text-slate-600">
                      Students browse and reserve, while owners manage listings,
                      requests, and tenant records from their dashboards.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button
              asChild
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Link href="/listings">Browse Listings</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <Link href="/register">List Your Property</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

