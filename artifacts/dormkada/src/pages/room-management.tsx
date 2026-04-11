import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRoute, useLocation } from "wouter";
import {
  useListRooms,
  useCreateRoom,
  useUpdateRoom,
  useGetMyBoardingHouses,
  getListRoomsQueryKey,
} from "@workspace/api-client-react";
import type { CreateRoomBodyType } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ImageCarousel from "@/components/ImageCarousel";
import { Loader2, Plus, ChevronLeft, Edit2, Save, X, Upload } from "lucide-react";
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

export default function RoomManagement() {
  const [match, params] = useRoute("/owner/rooms/:boardingHouseId");
  const boardingHouseId = match ? parseInt(params.boardingHouseId) : 0;
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: listings = [] } = useGetMyBoardingHouses();
  const { data: rooms = [], isLoading: isLoadingRooms } = useListRooms(boardingHouseId, undefined, {
    query: {
      enabled: !!boardingHouseId,
    } as any,
  });

  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();

  const [showAddForm, setShowAddForm] = useState(false);
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

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle file upload
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process images. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Remove photo
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

  const currentHouse = listings.find((h) => h.id === boardingHouseId);

  if (!currentHouse) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Boarding House Not Found</h2>
          <Button onClick={() => setLocation("/owner")} variant="outline">
            Back to Dashboard
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
    setShowAddForm(true);
  };

  const handleEditRoom = (room: any) => {
    setFormData({
      name: room.name,
      type: room.type,
      floor: room.floor,
      price: room.price,
      totalSlots: room.totalSlots,
      availableSlots: room.availableSlots,
      amenities: room.amenities?.join(", ") || "",
      description: room.description || "",
      photos: room.photos || [],
    });
    setEditingRoomId(room.id);
    setShowAddForm(true);
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
    const status = availableSlots === 0 ? "full" : 
                   availableSlots === 1 ? "almost_full" : "available";

    // Prepare data for update or create with proper typing
    const roomDataBase = {
      name: formData.name,
      floor: formData.floor || null,
      price: formData.price,
      totalSlots: formData.totalSlots,
      availableSlots: availableSlots,
      amenities: formData.amenities
        ? formData.amenities.split(",").map((a) => a.trim()).filter((a) => a)
        : [],
      photos: formData.photos || [],
      description: formData.description,
      status: status,
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
            toast({ title: "Room Updated Successfully" });
            // Force hard refresh of the room data
            queryClient.invalidateQueries({ queryKey: getListRoomsQueryKey(boardingHouseId) });
            setShowAddForm(false);
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
        }
      );
    } else {
      createRoom.mutate(
        { id: boardingHouseId, data: roomData },
        {
          onSuccess: () => {
            toast({ title: "Room Added Successfully" });
            queryClient.invalidateQueries({ queryKey: getListRoomsQueryKey(boardingHouseId) });
            setShowAddForm(false);
          },
          onError: (error: any) => {
            console.error("Create error:", error);
            toast({
              title: "Error",
              description: error?.message || "Failed to create room.",
              variant: "destructive",
            });
          },
        }
      );
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingRoomId(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-emerald-100 text-emerald-800";
      case "almost_full":
        return "bg-amber-100 text-amber-800";
      case "full":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          className="p-0 h-auto text-slate-600 hover:text-slate-900"
          onClick={() => setLocation("/owner")}
        >
          <ChevronLeft className="h-5 w-5 mr-1" /> Back to Dashboard
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{currentHouse.name}</h1>
        <p className="text-slate-600">Location: {currentHouse.barangay}</p>
      </div>

      {/* Add Room Button */}
      {!showAddForm && (
        <Button
          className="bg-blue-600 hover:bg-blue-700 mb-6 w-full sm:w-auto"
          onClick={handleAddRoom}
        >
          <Plus className="h-4 w-4 mr-2" /> Add New Room
        </Button>
      )}

      {/* Add/Edit Room Form */}
      {showAddForm && (
        <Card className="mb-8 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle>{editingRoomId ? "Edit Room" : "Add New Room"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Room Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Room 101"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Room Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {roomTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Floor
                </label>
                <input
                  type="number"
                  value={formData.floor || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, floor: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                  placeholder="e.g., 1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Price (per month) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Total Slots *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.totalSlots}
                  onChange={(e) =>
                    setFormData({ ...formData, totalSlots: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Available Slots *
                </label>
                <input
                  type="number"
                  min="0"
                  max={formData.totalSlots}
                  value={formData.availableSlots}
                  onChange={(e) =>
                    setFormData({ ...formData, availableSlots: Math.min(formData.totalSlots, parseInt(e.target.value) || 0) })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Amenities (comma-separated)
              </label>
              <input
                type="text"
                value={formData.amenities}
                onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                placeholder="e.g., WiFi, AC, Bed, Desk"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add room description..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Room Photos
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                <Upload className="h-6 w-6 mx-auto text-slate-400 mb-2" />
                <p className="text-xs text-slate-500 mb-2">Click to upload photos (JPG, PNG, etc.)</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById("photo-upload")?.click();
                    }}
                  >
                    <Upload className="h-3 w-3 mr-1" /> Choose Photos
                  </Button>
                </label>
              </div>

              {/* Photo Preview */}
              {formData.photos && formData.photos.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">Uploaded Photos ({formData.photos.length})</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {formData.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Room ${index + 1}`}
                          className="w-full h-20 object-cover rounded border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSubmit}
                disabled={createRoom.isPending || updateRoom.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {createRoom.isPending || updateRoom.isPending ? "Saving..." : "Save Room"}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={createRoom.isPending || updateRoom.isPending}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rooms List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Rooms ({rooms.length})</h2>

        {isLoadingRooms ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : rooms.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <h3 className="text-lg font-medium text-slate-900 mb-2">No rooms added yet</h3>
              <p className="text-slate-500 mb-4">Start by adding your first room</p>
              {!showAddForm && (
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleAddRoom}>
                  <Plus className="h-4 w-4 mr-2" /> Add First Room
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rooms.map((room: any) => (
              <Card key={room.id} className="overflow-hidden">
                {/* Room Photos */}
                {room.photos && room.photos.length > 0 ? (
                  <ImageCarousel
                    images={room.photos}
                    alt={room.name}
                    className="h-40 bg-slate-200 w-full"
                  />
                ) : (
                  <div className="h-40 bg-slate-200 flex items-center justify-center text-slate-400">
                    No Photos
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                    <div>
                      <CardTitle className="text-lg">{room.name}</CardTitle>
                      <p className="text-sm text-slate-500 mt-1">
                        Type: {roomTypes.find((t) => t.value === room.type)?.label}
                        {room.floor && ` • Floor: ${room.floor}`}
                      </p>
                    </div>
                    <Badge className={getStatusColor(room.status)}>
                      {room.status === "almost_full" ? "Almost Full" : room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Available Slots</p>
                      <p className="text-2xl font-bold text-emerald-600">{room.availableSlots}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Total Slots</p>
                      <p className="text-2xl font-bold text-slate-900">{room.totalSlots}</p>
                    </div>
                  </div>

                  <div className="bg-slate-100 rounded p-3">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-slate-600">Occupancy</span>
                      <span className="font-semibold text-slate-900">
                        {room.totalSlots - room.availableSlots}/{room.totalSlots}
                      </span>
                    </div>
                    <div className="w-full bg-slate-300 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${((room.totalSlots - room.availableSlots) / room.totalSlots) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <p className="text-sm text-slate-600 mb-2">
                      <span className="font-semibold">Price:</span> ₱{room.price.toLocaleString()}/month
                    </p>
                    {room.amenities && room.amenities.length > 0 && (
                      <p className="text-sm text-slate-600 mb-2">
                        <span className="font-semibold">Amenities:</span> {room.amenities.join(", ")}
                      </p>
                    )}
                    {room.description && (
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold">Description:</span> {room.description}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => handleEditRoom(room)}
                      disabled={createRoom.isPending || updateRoom.isPending}
                    >
                      <Edit2 className="h-4 w-4 mr-1" /> Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
