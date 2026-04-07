import { useAuth } from "@/hooks/use-auth";
import { useListReservations } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, MapPin, Clock, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Link, Redirect } from "wouter";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { data: reservations = [], isLoading: isResLoading } = useListReservations();

  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (user?.role !== "student") {
    return <Redirect to="/" />;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-amber-500"><Clock className="h-3 w-3 mr-1"/> Pending</Badge>;
      case 'accepted': return <Badge className="bg-emerald-500"><CheckCircle2 className="h-3 w-3 mr-1"/> Accepted</Badge>;
      case 'rejected': return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1"/> Rejected</Badge>;
      case 'expired': return <Badge className="bg-slate-500">Expired</Badge>;
      case 'cancelled': return <Badge className="bg-slate-800">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Student Dashboard</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Account Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold">
                    {user?.fullName?.charAt(0) || "U"}
                  </div>
                  <div>
                    <p className="font-bold text-lg">{user?.fullName}</p>
                    <p className="text-slate-500 text-sm">{user?.email}</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Badge variant="outline" className="bg-slate-50">Student Account</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">My Reservations</CardTitle>
            </CardHeader>
            <CardContent>
              {isResLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
              ) : reservations.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium mb-1">No reservations yet</p>
                  <p className="text-sm text-slate-500 mb-4">Start browsing properties to find your dorm.</p>
                  <Link href="/listings" className="text-blue-600 hover:underline font-medium text-sm">Browse Listings</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {reservations.map((res) => (
                    <div key={res.id} className={`p-4 rounded-lg border ${res.flagged ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200 bg-white'} relative overflow-hidden`}>
                      {res.flagged && (
                        <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Flagged
                        </div>
                      )}
                      
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-lg">
                            <Link href={`/listings/${res.boardingHouseId}`} className="hover:text-blue-600">
                              {res.boardingHouseName || `Boarding House #${res.boardingHouseId}`}
                            </Link>
                          </h4>
                          <p className="text-sm text-slate-600 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {res.roomName || `Room #${res.roomId}`}
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(res.status)}
                          {res.price && <p className="font-bold text-slate-900 mt-1">₱{res.price}/mo</p>}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t">
                        <span>Requested on {new Date(res.createdAt).toLocaleDateString()}</span>
                        {res.status === 'pending' && res.expiresAt && (
                          <span className="text-amber-600 font-medium flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Expires {new Date(res.expiresAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
