import { useState } from "react";
import { useGetBoardingHouse, useListRooms, getGetBoardingHouseQueryKey, getListRoomsQueryKey } from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageCarousel from "@/components/ImageCarousel";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Home,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Star,
  Users,
  DollarSign,
  Shield,
} from "lucide-react";

interface BoardingHouseReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: number;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
}

export default function BoardingHouseReviewModal({
  open,
  onOpenChange,
  listingId,
  onApprove,
  onReject,
  isApproving = false,
  isRejecting = false,
}: BoardingHouseReviewModalProps) {
  const { data: house, isLoading: isLoadingHouse } = useGetBoardingHouse(
    listingId,
    {
      query: {
        enabled: open && !!listingId,
        queryKey: getGetBoardingHouseQueryKey(listingId),
      },
    }
  );

  const { data: rooms = [], isLoading: isLoadingRooms } = useListRooms(
    listingId,
    {
      query: {
        enabled: open && !!listingId,
        queryKey: getListRoomsQueryKey(listingId),
      },
    } as any
  );

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Boarding House Details</DialogTitle>
        </DialogHeader>

        {isLoadingHouse || isLoadingRooms ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : house ? (
          <div className="space-y-6">
            {/* Header with Name and Owner */}
            <div className="bg-slate-100 p-4 rounded-lg border border-slate-200">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    {house.name}
                  </h2>
                  <p className="text-slate-600 flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4" />
                    {house.address}, {house.barangay}
                  </p>
                  <p className="text-sm text-slate-600">
                    Owner: <span className="font-semibold">{house.ownerName || `ID: ${house.ownerId}`}</span>
                  </p>
                </div>
                <div className="text-right">
                  <Badge className="bg-blue-600 hover:bg-blue-700">
                    {house.genderPolicy === "mixed"
                      ? "Mixed Gender"
                      : house.genderPolicy === "female_only"
                      ? "Female Only"
                      : "Male Only"}
                  </Badge>
                  <div className="flex items-center gap-1 mt-3 justify-end">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold">
                      {house.rating || "New"}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({house.reviewCount} reviews)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs for different sections */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="amenities">Amenities</TabsTrigger>
                <TabsTrigger value="rooms">Rooms</TabsTrigger>
                <TabsTrigger value="photos">Photos</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Description</CardTitle>
                  </CardHeader>
                  <CardContent className="text-slate-600 leading-relaxed">
                    {house.description || (
                      <span className="text-slate-400">No description provided</span>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Pricing
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 mb-1">Price Range</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ₱{house.priceMin} - ₱{house.priceMax}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">per month</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Room Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-slate-600">Total Rooms</p>
                          <p className="text-2xl font-bold text-slate-900">
                            {house.totalRooms}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Available</p>
                          <p className="text-lg font-semibold text-emerald-600">
                            {house.availableRooms}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {house.rules && (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2 text-amber-900">
                        <AlertCircle className="h-4 w-4" />
                        House Rules
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-amber-900">
                      <p className="whitespace-pre-line text-sm leading-relaxed">
                        {house.rules}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Contact Tab */}
              <TabsContent value="contact" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {house.contactEmail ? (
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-slate-600">Email</p>
                          <a
                            href={`mailto:${house.contactEmail}`}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            {house.contactEmail}
                          </a>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm">No email provided</p>
                    )}

                    {house.contactPhone ? (
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm text-slate-600">Phone</p>
                          <p className="font-medium">{house.contactPhone}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm">No phone provided</p>
                    )}

                    {house.socialMediaUrl ? (
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="text-sm text-slate-600">Website/Social</p>
                          <a
                            href={house.socialMediaUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline font-medium truncate"
                          >
                            {house.socialMediaUrl}
                          </a>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm">
                        No social media URL provided
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Amenities Tab */}
              <TabsContent value="amenities" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Amenities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {house.amenities && house.amenities.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {house.amenities.map((amenity, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="bg-blue-50 text-blue-700"
                          >
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm">No amenities listed</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Rooms Tab */}
              <TabsContent value="rooms" className="space-y-4">
                {isLoadingRooms ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : rooms && rooms.length > 0 ? (
                  <div className="space-y-3">
                    {rooms.map((room) => (
                      <Card key={room.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900">
                                {room.name}
                              </p>
                              <p className="text-sm text-slate-600 mt-1">
                                Type: {room.type}
                              </p>
                              {room.floor && (
                                <p className="text-sm text-slate-600">
                                  Floor: {room.floor}
                                </p>
                              )}
                              <p className="text-sm text-slate-600">
                                Capacity: {room.totalSlots} slots ({room.availableSlots} available)
                              </p>
                              <p className="text-sm text-slate-600 mt-1">
                                ₱{room.price}/month
                              </p>
                              {room.amenities && room.amenities.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {room.amenities.map((amenity, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="secondary"
                                      className="text-xs bg-slate-100 text-slate-700"
                                    >
                                      {amenity}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              {room.status === "available" ? (
                                <Badge className="bg-emerald-600 hover:bg-emerald-700">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Available
                                </Badge>
                              ) : room.status === "almost_full" ? (
                                <Badge className="bg-amber-600 hover:bg-amber-700">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Almost Full
                                </Badge>
                              ) : (
                                <Badge className="bg-slate-600 hover:bg-slate-700">
                                  <Users className="h-3 w-3 mr-1" />
                                  Full
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-slate-500">No rooms listed yet</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Photos Tab */}
              <TabsContent value="photos" className="space-y-4">
                {house.photos && house.photos.length > 0 ? (
                  <ImageCarousel
                    images={house.photos}
                    alt={house.name}
                    className="w-full h-96 rounded-lg"
                  />
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Home className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500">No photos provided</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-slate-500">Unable to load boarding house details</p>
          </div>
        )}

        <DialogFooter className="flex gap-2 justify-end pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isApproving || isRejecting}
          >
            Close
          </Button>
          <Button
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => onReject(listingId)}
            disabled={isApproving || isRejecting}
          >
            {isRejecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Rejecting...
              </>
            ) : (
              "Reject"
            )}
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => onApprove(listingId)}
            disabled={isApproving || isRejecting}
          >
            {isApproving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Approving...
              </>
            ) : (
              "Approve"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
