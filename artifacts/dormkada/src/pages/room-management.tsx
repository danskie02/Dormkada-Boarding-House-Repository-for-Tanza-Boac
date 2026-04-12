import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRoute, useLocation } from "wouter";
import {
  useListRooms,
  useCreateRoom,
  useUpdateRoom,
  useGetMyBoardingHouses,
  getListRoomsQueryKey,
  getGetMyBoardingHousesQueryKey,
} from "@workspace/api-client-react";
import type { CreateRoomBodyType } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import ImageCarousel from "@/components/ImageCarousel";
import { Loader2, Plus, ChevronLeft, Edit2, Save, X, Upload, DoorOpen } from "lucide-react";
import { Redirect } from "wouter";

interface RoomFormData {
  name: string;
  type: string;
  floor?: number;
  price: number;
  totalSlots: number;
  availableSlots: number;
  amenities: string;
  description: string;
  photos: string[];
}

const inputClass =
  "w-full px-3 py-2 border border-violet-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-400";

export default function RoomManagement() {
  const [match, params] = useRoute("/owner/rooms/:boardingHouseId");
  const boardingHouseId = match ? parseInt(params.boardingHouseId, 10) : 0;
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: listings = [], isLoading: isListingsLoading } = useGetMyBoardingHouses();
  const { data: rooms = [], isLoading: isLoadingRooms } = useListRooms(boardingHouseId, undefined, {
    query: {
      enabled: !!boardingHouseId,
    } as any,
  });

  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();

  const [showRoomSheet, setShowRoomSheet] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [formData, setFormData] = useState<RoomFormData>({
    name: "",
    type: "single",
    floor: undefined,
    price: 0,
    totalSlots: 1,
    availableSlots: 1,
    amenities: "",
    description: "",
    photos: [],
  });

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    try {
      const base64Files: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const base64 = await fileToBase64(files[i]);
        base64Files.push(base64);
      }
      setFormData({ ...formData, photos: [...formData.photos, ...base64Files] });
      toast({ title: "Photos added successfully" });
    } catch {
      toast({
        title: "Error",
        description: "Failed to process images. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removePhoto = (index: number) => {
    setFormData({
      ...formData,
      photos: formData.photos.filter((_, i) => i !== index),
    });
  };

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (user?.role !== "owner") {
    return <Redirect to="/" />;
  }

  if (!boardingHouseId || Number.isNaN(boardingHouseId)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Invalid property link</h2>
          <Button onClick={() => setLocation("/owner")} variant="outline">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (isListingsLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
      </div>
    );
  }

  const currentHouse = listings.find((h) => h.id === boardingHouseId);

  if (!currentHouse) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12 max-w-md mx-auto rounded-2xl border border-amber-200 bg-amber-50/80 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Boarding house not found</h2>
          <p className="text-slate-600 mb-6 text-sm">
            This property is not in your account, or it may still be loading. Return to your dashboard and open &quot;Manage Rooms&quot; from a listing card.
          </p>
          <Button onClick={() => setLocation("/owner")} className="bg-violet-600 hover:bg-violet-700">
            Back to Owner Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleAddRoom = () => {
    setFormData({
      name: "",
      type: "single",
      floor: undefined,
      price: 0,
      totalSlots: 1,
      availableSlots: 1,
      amenities: "",
      description: "",
      photos: [],
    });
    setEditingRoomId(null);
    setShowRoomSheet(true);
  };

  const handleEditRoom = (room: {
    id: number;
    name: string;
    type: string;
    floor: number | null;
    price: number;
    totalSlots: number;
    availableSlots: number;
    amenities: string[];
    description: string | null;
    photos: string[];
  }) => {
    setFormData({
      name: room.name,
      type: room.type,
      floor: room.floor ?? undefined,
      price: room.price,
      totalSlots: room.totalSlots,
      availableSlots: room.availableSlots,
      amenities: room.amenities?.join(", ") || "",
      description: room.description || "",
      photos: room.photos || [],
    });
    setEditingRoomId(room.id);
    setShowRoomSheet(true);
  };

  const invalidateRoomQueries = () => {
    queryClient.invalidateQueries({ queryKey: getListRoomsQueryKey(boardingHouseId) });
    queryClient.invalidateQueries({ queryKey: getGetMyBoardingHousesQueryKey() });
  };

  const handleSubmit = () => {
    if (!formData.name || formData.price < 0 || formData.totalSlots < 1) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    const availableSlots = Math.min(formData.availableSlots, formData.totalSlots);
    const status =
      availableSlots === 0 ? "full" : availableSlots === 1 ? "almost_full" : "available";

    const roomDataBase = {
      name: formData.name,
      floor: formData.floor ?? null,
      price: formData.price,
      totalSlots: formData.totalSlots,
      availableSlots,
      amenities: formData.amenities
        ? formData.amenities
            .split(",")
            .map((a) => a.trim())
            .filter((a) => a)
        : [],
      photos: formData.photos || [],
      description: formData.description,
      status,
    };

    const roomData = {
      ...roomDataBase,
      type: formData.type as CreateRoomBodyType,
    };

    if (editingRoomId) {
      updateRoom.mutate(
        { id: editingRoomId, data: roomData },
        {
          onSuccess: () => {
            toast({ title: "Room updated", description: "Slot counts are saved to your listing." });
            invalidateRoomQueries();
            setShowRoomSheet(false);
            setEditingRoomId(null);
          },
          onError: (error: any) => {
            console.error("Update error:", error);
            toast({
              title: "Error",
              description: error?.message || "Failed to update room. Please try again.",
              variant: "destructive",
            });
          },
        },
      );
    } else {
      createRoom.mutate(
        { id: boardingHouseId, data: roomData },
        {
          onSuccess: () => {
            toast({ title: "Room added" });
            invalidateRoomQueries();
            setShowRoomSheet(false);
          },
          onError: (error: any) => {
            console.error("Create error:", error);
            toast({
              title: "Error",
              description: error?.message || "Failed to create room.",
              variant: "destructive",
            });
          },
        },
      );
    }
  };

  const handleSheetOpenChange = (open: boolean) => {
    if (!open) {
      setShowRoomSheet(false);
      setEditingRoomId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "almost_full":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "full":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const roomTypes = [
    { value: "single", label: "Single" },
    { value: "twin", label: "Twin" },
    { value: "triple", label: "Triple" },
    { value: "quad", label: "Quad" },
    { value: "bedspacer_2", label: "Bedspacer (2 Beds)" },
    { value: "bedspacer_3", label: "Bedspacer (3 Beds)" },
  ];

  const isSaving = createRoom.isPending || updateRoom.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/80 via-white to-indigo-50/40">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 text-violet-800 hover:text-violet-950 hover:bg-violet-100/80"
          onClick={() => setLocation("/owner")}
        >
          <ChevronLeft className="h-5 w-5 mr-1" /> Back to Dashboard
        </Button>

        <div className="rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 p-6 sm:p-8 text-white shadow-lg mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <DoorOpen className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{currentHouse.name}</h1>
              <p className="text-violet-100 mt-1">{currentHouse.barangay}</p>
              <p className="text-sm text-violet-200/90 mt-2 max-w-xl">
                Add or edit rooms in the side panel — it opens from the right so it stays tied to the room you&apos;re editing.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-slate-900">Rooms ({rooms.length})</h2>
          <Button
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md w-full sm:w-auto"
            onClick={handleAddRoom}
          >
            <Plus className="h-4 w-4 mr-2" /> Add New Room
          </Button>
        </div>

        <Sheet open={showRoomSheet} onOpenChange={handleSheetOpenChange}>
          <SheetContent
            side="right"
            className="w-full sm:max-w-lg overflow-y-auto border-l-violet-200 bg-gradient-to-b from-white to-violet-50/30"
          >
            <SheetHeader className="text-left border-b border-violet-100 pb-4 mb-4">
              <SheetTitle className="text-violet-900 text-xl">
                {editingRoomId ? "Edit room" : "Add new room"}
              </SheetTitle>
              <SheetDescription>
                {editingRoomId
                  ? "Update capacity, pricing, and details. Total and available slots are saved to the database when you save."
                  : "Create a room for this boarding house. You can set total beds and how many are still open."}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 pb-8">
              <div className="rounded-lg bg-violet-100/60 border border-violet-200 p-3 text-sm text-violet-900">
                <strong>Slots:</strong> Total slots = capacity. Available = empty beds now. Status updates automatically
                (available / almost full / full).
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-violet-900 mb-2">Room name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Room 101"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-violet-900 mb-2">Room type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className={inputClass}
                  >
                    {roomTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-violet-900 mb-2">Floor</label>
                  <input
                    type="number"
                    value={formData.floor ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        floor: e.target.value ? parseInt(e.target.value, 10) : undefined,
                      })
                    }
                    placeholder="e.g., 1"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-violet-900 mb-2">Price (₱ / month) *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value, 10) || 0 })}
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-violet-900 mb-2">Total slots *</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.totalSlots}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalSlots: Math.max(1, parseInt(e.target.value, 10) || 1),
                        })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-violet-900 mb-2">Available *</label>
                    <input
                      type="number"
                      min="0"
                      max={formData.totalSlots}
                      value={formData.availableSlots}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          availableSlots: Math.min(
                            formData.totalSlots,
                            parseInt(e.target.value, 10) || 0,
                          ),
                        })
                      }
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-violet-900 mb-2">Amenities (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.amenities}
                    onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                    placeholder="WiFi, AC, Desk"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-violet-900 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-violet-900 mb-2">Room photos</label>
                  <div className="border-2 border-dashed border-violet-300 rounded-lg p-4 text-center bg-violet-50/50">
                    <Upload className="h-6 w-6 mx-auto text-violet-400 mb-2" />
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="room-photo-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-violet-700 border-violet-300 hover:bg-violet-100"
                      onClick={() => document.getElementById("room-photo-upload")?.click()}
                    >
                      <Upload className="h-3 w-3 mr-1" /> Choose photos
                    </Button>
                  </div>
                  {formData.photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {formData.photos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={photo}
                            alt=""
                            className="w-full h-20 object-cover rounded border border-violet-200"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-4 border-t border-violet-100">
                  <Button
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                    onClick={handleSubmit}
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving…" : "Save to database"}
                  </Button>
                  <Button variant="outline" onClick={() => handleSheetOpenChange(false)} disabled={isSaving}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {isLoadingRooms ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          </div>
        ) : rooms.length === 0 ? (
          <Card className="border-violet-200 bg-white/80 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-14 text-center">
              <h3 className="text-lg font-medium text-slate-900 mb-2">No rooms yet</h3>
              <p className="text-slate-500 mb-4">Add your first room using the button above.</p>
              <Button className="bg-violet-600 hover:bg-violet-700" onClick={handleAddRoom}>
                <Plus className="h-4 w-4 mr-2" /> Add first room
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rooms.map((room: any) => (
              <Card
                key={room.id}
                className="overflow-hidden border-slate-200 shadow-sm border-l-4 border-l-violet-500 bg-white/90"
              >
                {room.photos && room.photos.length > 0 ? (
                  <ImageCarousel
                    images={room.photos}
                    alt={room.name}
                    className="h-40 bg-slate-200 w-full"
                  />
                ) : (
                  <div className="h-40 bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-violet-400 text-sm">
                    No photos
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                    <div>
                      <CardTitle className="text-lg text-slate-900">{room.name}</CardTitle>
                      <p className="text-sm text-slate-500 mt-1">
                        {roomTypes.find((t) => t.value === room.type)?.label}
                        {room.floor != null && ` • Floor ${room.floor}`}
                      </p>
                    </div>
                    <Badge className={getStatusColor(room.status)}>
                      {room.status === "almost_full" ? "Almost full" : room.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                      <p className="text-xs text-emerald-800 uppercase font-semibold">Available</p>
                      <p className="text-2xl font-bold text-emerald-700">{room.availableSlots}</p>
                    </div>
                    <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3">
                      <p className="text-xs text-indigo-800 uppercase font-semibold">Total slots</p>
                      <p className="text-2xl font-bold text-indigo-700">{room.totalSlots}</p>
                    </div>
                  </div>

                  <div className="bg-violet-50/80 rounded-lg p-3 border border-violet-100">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-violet-900">Occupied</span>
                      <span className="font-semibold text-violet-950">
                        {room.totalSlots - room.availableSlots}/{room.totalSlots}
                      </span>
                    </div>
                    <div className="w-full bg-violet-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${((room.totalSlots - room.availableSlots) / room.totalSlots) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-3 text-sm text-slate-600">
                    <p>
                      <span className="font-semibold text-slate-800">₱{room.price.toLocaleString()}</span>/mo
                    </p>
                    {room.amenities?.length > 0 && (
                      <p className="mt-1">
                        <span className="font-semibold">Amenities:</span> {room.amenities.join(", ")}
                      </p>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-violet-300 text-violet-800 hover:bg-violet-50"
                    onClick={() => handleEditRoom(room)}
                    disabled={isSaving}
                  >
                    <Edit2 className="h-4 w-4 mr-1" /> Edit room
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
