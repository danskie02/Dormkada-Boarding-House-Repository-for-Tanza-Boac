import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { 
  useGetStatsSummary,
  useListPendingOwners,
  useListPendingListings,
  useVerifyOwner,
  useApproveListing,
  useRejectListing,
  useSuspendUser,
  getGetStatsSummaryQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Ban, ExternalLink, ShieldAlert, Eye } from "lucide-react";
import { Redirect } from "wouter";
import BoardingHouseReviewModal from "@/components/BoardingHouseReviewModal";

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<number | null>(null);

  const { data: stats, isLoading: isStatsLoading } = useGetStatsSummary();
  const { data: pendingOwners = [], isLoading: isOwnersLoading, refetch: refetchOwners } = useListPendingOwners();
  const { data: pendingListings = [], isLoading: isListingsLoading, refetch: refetchListings } = useListPendingListings();

  const verifyOwner = useVerifyOwner();
  const suspendUser = useSuspendUser();
  const approveListing = useApproveListing();
  const rejectListing = useRejectListing();

  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (user?.role !== "admin") {
    return <Redirect to="/" />;
  }

  const handleVerifyOwner = (id: number) => {
    verifyOwner.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Owner Verified successfully" });
          refetchOwners();
        }
      }
    );
  };

  const handleSuspendOwner = (id: number) => {
    suspendUser.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "User Suspended" });
          refetchOwners();
        }
      }
    );
  };

  const handleApproveListing = (id: number) => {
    approveListing.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Listing Approved" });
          refetchListings();
          queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
        }
      }
    );
  };

  const handleRejectListing = (id: number) => {
    rejectListing.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Listing Rejected" });
          refetchListings();
        }
      }
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-slate-50 min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <ShieldAlert className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-slate-900">Admin Control Panel</h1>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500 mb-1">Total Listings</p>
            {isStatsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <h3 className="text-3xl font-bold text-blue-600">{stats?.totalListings || 0}</h3>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500 mb-1">Available Rooms</p>
            {isStatsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <h3 className="text-3xl font-bold text-amber-500">{stats?.availableRooms || 0}</h3>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500 mb-1">Total Rooms</p>
            {isStatsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <h3 className="text-3xl font-bold text-slate-800">{stats?.totalRooms || 0}</h3>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500 mb-1">Active Reservations</p>
            {isStatsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <h3 className="text-3xl font-bold text-emerald-600">{stats?.activeReservations || 0}</h3>}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Pending ID Verifications */}
        <Card>
          <CardHeader className="bg-slate-100 border-b pb-4">
            <CardTitle className="text-lg flex justify-between items-center">
              Pending ID Verifications
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">{pendingOwners.length}</Badge>
            </CardTitle>
            <CardDescription>Verify landlord identities before they can post listings.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isOwnersLoading ? (
              <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
            ) : pendingOwners.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No pending verifications.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingOwners.map((owner) => (
                  <div key={owner.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50">
                    <div>
                      <p className="font-bold text-slate-900">{owner.fullName}</p>
                      <p className="text-sm text-slate-500 mb-2">{owner.email}</p>
                      {owner.idImageUrl ? (
                        <a href={owner.idImageUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                          <ExternalLink className="h-3 w-3" /> View ID Document
                        </a>
                      ) : (
                        <span className="text-xs text-red-500">No ID provided</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleSuspendOwner(owner.id)}>
                        <Ban className="h-4 w-4 mr-1" /> Suspend
                      </Button>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleVerifyOwner(owner.id)} disabled={!owner.idImageUrl}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Verify
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Listings */}
        <Card>
          <CardHeader className="bg-slate-100 border-b pb-4">
            <CardTitle className="text-lg flex justify-between items-center">
              Pending Listings
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">{pendingListings.length}</Badge>
            </CardTitle>
            <CardDescription>Review new property listings before they go live.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isListingsLoading ? (
              <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
            ) : pendingListings.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No pending listings.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingListings.map((listing) => (
                  <div key={listing.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50">
                    <div>
                      <p className="font-bold text-slate-900">{listing.name}</p>
                      <p className="text-sm text-slate-500">{listing.address}, {listing.barangay}</p>
                      <p className="text-xs font-medium text-slate-600 mt-1">Owner: {listing.ownerName || `ID: ${listing.ownerId}`}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                        onClick={() => {
                          setSelectedListingId(listing.id);
                          setReviewModalOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" /> View Details
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleRejectListing(listing.id)}>
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleApproveListing(listing.id)}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedListingId && (
        <BoardingHouseReviewModal
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
          listingId={selectedListingId}
          onApprove={handleApproveListing}
          onReject={handleRejectListing}
          isApproving={approveListing.isPending}
          isRejecting={rejectListing.isPending}
        />
      )}
    </div>
  );
}
