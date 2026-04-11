import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { 
  useGetBoardingHouse, 
  useListRooms, 
  useCreateReservation, 
  getGetBoardingHouseQueryKey,
  getListRoomsQueryKey
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageCarousel from "@/components/ImageCarousel";
import { MapPin, Star, Phone, Mail, Globe, CheckCircle2, AlertCircle, Home, Users, Loader2 } from "lucide-react";

export default function ListingDetail() {
  const [match, params] = useRoute("/listings/:id");
  const id = match ? parseInt(params.id) : 0;
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("all");

  const { data: house, isLoading: isLoadingHouse } = useGetBoardingHouse(id, {
    query: {
      enabled: !!id,
      queryKey: getGetBoardingHouseQueryKey(id),
    }
  });

  const { data: rooms = [], isLoading: isLoadingRooms } = useListRooms(id, {
    query: {
      enabled: !!id,
      queryKey: getListRoomsQueryKey(id),
    }
  });

  const createReservation = useCreateReservation();

  const handleReserve = (roomId: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to reserve a room.",
      });
      setLocation("/login");
      return;
    }

    createReservation.mutate(
      { data: { roomId } },
      {
        onSuccess: () => {
          toast({
            title: "Reservation Successful",
            description: "Your reservation request has been sent to the owner.",
          });
          queryClient.invalidateQueries({ queryKey: getListRoomsQueryKey(id) });
          setLocation("/dashboard");
        },
        onError: (err: any) => {
          toast({
            title: "Reservation Failed",
            description: err.error || "Failed to make a reservation.",
            variant: "destructive",
          });
        }
      }
    );
  };

  if (isLoadingHouse) {
    return (
      <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!house) {
    return (
      <div className="min-h-[calc(100vh-16rem)] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Listing Not Found</h2>
        <p className="text-slate-500 mb-4">The boarding house you're looking for doesn't exist.</p>
        <Link href="/listings">
          <Button>Back to Listings</Button>
        </Link>
      </div>
    );
  }

  const filteredRooms = rooms.filter((room) => {
    if (activeTab === "all") return true;
    if (activeTab === "available") return room.status === "available";
    if (activeTab === "almost_full") return room.status === "almost_full";
    if (activeTab === "full") return room.status === "full";
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <Link href="/listings" className="text-slate-400 hover:text-white mb-6 inline-flex items-center text-sm">
            ← Back to all listings
          </Link>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-blue-600 hover:bg-blue-700">
                  {house.genderPolicy === "mixed" ? "Mixed Gender" : 
                   house.genderPolicy === "female_only" ? "Female Only" : "Male Only"}
                </Badge>
                {house.status === "approved" && (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{house.name}</h1>
              <p className="text-slate-300 flex items-center gap-2">
                <MapPin className="h-4 w-4" /> {house.address}, {house.barangay}
              </p>
            </div>
            
            <div className="text-left md:text-right bg-slate-800/50 p-4 rounded-lg border border-slate-700">
              <div className="flex items-center gap-2 mb-1 justify-start md:justify-end">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <span className="text-2xl font-bold">{house.rating || "New"}</span>
                <span className="text-slate-400">({house.reviewCount} reviews)</span>
              </div>
              <p className="text-sm text-slate-300">
                Starts at <span className="text-amber-400 font-bold text-xl">₱{house.priceMin}</span>/mo
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery */}
            {house.photos && house.photos.length > 0 ? (
              <ImageCarousel
                images={house.photos}
                alt={house.name}
                className="w-full h-96 rounded-xl"
              />
            ) : (
              <div className="w-full aspect-video bg-slate-200 rounded-xl flex items-center justify-center">
                <Home className="h-16 w-16 text-slate-400" />
              </div>
            )}

            {/* Description & Amenities */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold mb-4 text-slate-900">About this Boarding House</h2>
              <p className="text-slate-600 mb-6 leading-relaxed">
                {house.description || "No description provided."}
              </p>
              
              <h3 className="font-semibold text-slate-900 mb-3">Amenities</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {house.amenities && house.amenities.length > 0 ? (
                  house.amenities.map((amenity, i) => (
                    <Badge key={i} variant="secondary" className="bg-blue-50 text-blue-700">
                      {amenity}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">Not specified</span>
                )}
              </div>

              {house.rules && (
                <>
                  <h3 className="font-semibold text-slate-900 mb-3">House Rules</h3>
                  <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 border border-slate-100">
                    {house.rules}
                  </div>
                </>
              )}
            </div>

            {/* Rooms */}
            <div id="rooms">
              <div className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Available Rooms</h2>
              </div>
              
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6 bg-white border">
                  <TabsTrigger value="all">All Rooms</TabsTrigger>
                  <TabsTrigger value="available">Available</TabsTrigger>
                  <TabsTrigger value="almost_full">Almost Full</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4">
                  {isLoadingRooms ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                  ) : filteredRooms.length === 0 ? (
                    <div className="text-center p-8 bg-white rounded-xl border border-slate-100">
                      <p className="text-slate-500">No rooms found matching this filter.</p>
                    </div>
                  ) : (
                    filteredRooms.map((room) => (
                      <Card key={room.id} className="overflow-hidden border-slate-200">
                        <div className="flex flex-col sm:flex-row">
                          <div className="w-full sm:w-48 h-48 sm:h-auto bg-slate-100 shrink-0">
                            {room.photos && room.photos.length > 0 ? (
                              <ImageCarousel
                                images={room.photos}
                                alt={room.name}
                                className="w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Home className="h-8 w-8 text-slate-300" />
                              </div>
                            )}
                          </div>
                          <div className="p-6 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-bold text-xl text-slate-900">{room.name}</h3>
                                <p className="text-sm text-slate-500 capitalize">{room.type.replace('_', ' ')} • Floor {room.floor || 'N/A'}</p>
                              </div>
                              <Badge className={
                                room.status === "available" ? "bg-emerald-500" :
                                room.status === "almost_full" ? "bg-amber-500" : "bg-red-500"
                              }>
                                {room.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            
                            <p className="text-slate-600 text-sm mb-4 line-clamp-2">{room.description}</p>
                            
                            <div className="flex items-center gap-4 text-sm mb-4 bg-slate-50 p-2 rounded">
                              <div className="flex items-center gap-1 text-slate-700">
                                <Users className="h-4 w-4 text-blue-600" />
                                <span>Capacity: {room.availableSlots} / {room.totalSlots} available</span>
                              </div>
                            </div>

                            <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                              <div>
                                <span className="text-2xl font-bold text-blue-600">₱{room.price}</span>
                                <span className="text-slate-500 text-sm">/month</span>
                              </div>
                              <Button 
                                onClick={() => handleReserve(room.id)}
                                disabled={room.status === "full" || createReservation.isPending}
                                className={room.status === "full" ? "bg-slate-300" : "bg-amber-500 hover:bg-amber-600 text-slate-900"}
                                data-testid={`button-reserve-${room.id}`}
                              >
                                {createReservation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {room.status === "full" ? "Full" : "Reserve Now"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm sticky top-24">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4">Contact Owner</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      {house.ownerName?.charAt(0) || "O"}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{house.ownerName || "Property Owner"}</p>
                      <p className="text-xs text-slate-500">Verified Owner</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    {house.contactPhone && (
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <span>{house.contactPhone}</span>
                      </div>
                    )}
                    {house.contactEmail && (
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <a href={`mailto:${house.contactEmail}`} className="hover:text-blue-600">{house.contactEmail}</a>
                      </div>
                    )}
                    {house.socialMediaUrl && (
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Globe className="h-4 w-4 text-slate-400" />
                        <a href={house.socialMediaUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                          Social Media Page
                        </a>
                      </div>
                    )}
                  </div>

                  <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => {
                    document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' });
                  }}>
                    View Available Rooms
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900 text-sm">Reservation Policy</h4>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Reserving a room sends a request to the owner. You have 24 hours to confirm with payment once accepted, otherwise the reservation expires.
                </p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
