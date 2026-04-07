import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { 
  useGetMyBoardingHouses, 
  useListReservations, 
  useAcceptReservation, 
  useRejectReservation,
  useListTenants,
  useUpdateTenantPayment,
  useCreateBoardingHouse,
  getGetMyBoardingHousesQueryKey,
  getListReservationsQueryKey,
  getListTenantsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Home, UserCheck, AlertTriangle, Check, X, MapPin } from "lucide-react";
import { Redirect } from "wouter";

export default function OwnerDashboard() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: listings = [], isLoading: isListingsLoading } = useGetMyBoardingHouses();
  const { data: allReservations = [], isLoading: isResLoading } = useListReservations();
  const { data: tenants = [], isLoading: isTenantsLoading } = useListTenants();

  const acceptReservation = useAcceptReservation();
  const rejectReservation = useRejectReservation();
  const updatePayment = useUpdateTenantPayment();

  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (user?.role !== "owner") {
    return <Redirect to="/" />;
  }

  const pendingReservations = allReservations.filter(r => r.status === 'pending');

  const handleAccept = (id: number) => {
    acceptReservation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Reservation Accepted", description: "The student will be notified." });
          queryClient.invalidateQueries({ queryKey: getListReservationsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListTenantsQueryKey() });
        }
      }
    );
  };

  const handleReject = (id: number) => {
    rejectReservation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Reservation Rejected" });
          queryClient.invalidateQueries({ queryKey: getListReservationsQueryKey() });
        }
      }
    );
  };

  const handlePaymentToggle = (tenantId: number, currentStatus: string) => {
    const newStatus = currentStatus === "paid" ? "unpaid" : "paid";
    updatePayment.mutate(
      { id: tenantId, data: { paymentStatus: newStatus } },
      {
        onSuccess: () => {
          toast({ title: `Payment status updated to ${newStatus}` });
          queryClient.invalidateQueries({ queryKey: getListTenantsQueryKey() });
        }
      }
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Owner Dashboard</h1>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" /> Add Listing
        </Button>
      </div>

      <Tabs defaultValue="listings">
        <TabsList className="mb-8">
          <TabsTrigger value="listings">My Properties</TabsTrigger>
          <TabsTrigger value="reservations" className="relative">
            Pending Requests
            {pendingReservations.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold">
                {pendingReservations.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="tenants">Tenants & Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="space-y-6">
          {isListingsLoading ? (
             <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
          ) : listings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Home className="h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No properties listed</h3>
                <p className="text-slate-500 mb-4">You haven't added any boarding houses yet.</p>
                <Button variant="outline">Add Your First Listing</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((house) => (
                <Card key={house.id} className="overflow-hidden">
                  <div className="h-40 bg-slate-200 relative">
                    {house.photos?.[0] ? (
                      <img src={house.photos[0]} alt={house.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">No Photo</div>
                    )}
                    <Badge className={`absolute top-2 right-2 ${house.status === 'approved' ? 'bg-emerald-500' : house.status === 'pending' ? 'bg-amber-500' : 'bg-red-500'}`}>
                      {house.status.toUpperCase()}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg mb-1 truncate">{house.name}</h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mb-4">
                      <MapPin className="h-3 w-3" /> {house.barangay}
                    </p>
                    <div className="flex justify-between items-center text-sm border-t pt-3">
                      <span className="text-slate-600">Rooms: {house.totalRooms}</span>
                      <Button variant="ghost" size="sm" className="text-blue-600 p-0 h-auto">Manage Rooms</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reservations">
          <Card>
            <CardHeader>
              <CardTitle>Pending Reservations</CardTitle>
            </CardHeader>
            <CardContent>
              {isResLoading ? (
                 <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
              ) : pendingReservations.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No pending reservations.</div>
              ) : (
                <div className="divide-y">
                  {pendingReservations.map((res) => (
                    <div key={res.id} className={`py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${res.flagged ? 'bg-amber-50/50 -mx-6 px-6' : ''}`}>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold">{res.studentName || `Student #${res.studentId}`}</h4>
                          {res.flagged && <Badge className="bg-amber-500 hover:bg-amber-600 text-[10px] px-1 py-0"><AlertTriangle className="h-3 w-3 mr-1" /> Flagged</Badge>}
                        </div>
                        <p className="text-sm text-slate-600">Requested: {res.roomName || `Room #${res.roomId}`} at {res.boardingHouseName}</p>
                        <p className="text-xs text-slate-400 mt-1">Date: {new Date(res.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleReject(res.id)}
                          disabled={rejectReservation.isPending}
                        >
                          <X className="h-4 w-4 mr-1" /> Reject
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleAccept(res.id)}
                          disabled={acceptReservation.isPending}
                        >
                          <Check className="h-4 w-4 mr-1" /> Accept
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tenants">
          <Card>
            <CardHeader>
              <CardTitle>Current Tenants</CardTitle>
            </CardHeader>
            <CardContent>
               {isTenantsLoading ? (
                 <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
              ) : tenants.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No active tenants found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                      <tr>
                        <th className="px-4 py-3">Tenant</th>
                        <th className="px-4 py-3">Property & Room</th>
                        <th className="px-4 py-3">Start Date</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {tenants.map((tenant) => (
                        <tr key={tenant.id} className="bg-white">
                          <td className="px-4 py-4 font-medium text-slate-900">
                            {tenant.studentName}
                            <div className="text-xs text-slate-500 font-normal">{tenant.studentEmail}</div>
                          </td>
                          <td className="px-4 py-4">
                            {tenant.boardingHouseName}
                            <div className="text-xs text-slate-500">{tenant.roomName}</div>
                          </td>
                          <td className="px-4 py-4">{new Date(tenant.startDate).toLocaleDateString()}</td>
                          <td className="px-4 py-4">
                            <Badge className={tenant.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}>
                              {tenant.paymentStatus.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handlePaymentToggle(tenant.id, tenant.paymentStatus)}
                              disabled={updatePayment.isPending}
                            >
                              Mark as {tenant.paymentStatus === 'paid' ? 'Unpaid' : 'Paid'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
