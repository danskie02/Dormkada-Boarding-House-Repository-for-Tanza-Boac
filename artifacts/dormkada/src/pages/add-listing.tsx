import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import {
  useCreateBoardingHouse,
  getGetMyBoardingHousesQueryKey,
  type CreateBoardingHouseBodyGenderPolicy,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, Save, Trash2, Upload } from "lucide-react";
import { Redirect } from "wouter";

interface ListingFormData {
  name: string;
  description: string;
  address: string;
  barangay: string;
  latitude?: string;
  longitude?: string;
  priceMin: string;
  priceMax: string;
  totalRooms: string;
  genderPolicy: string;
  photos: string;
  amenities: string;
  rules: string;
  contactEmail: string;
  contactPhone: string;
  socialMediaUrl: string;
}

const BARANGAYS = [
  "Tanza"
];

export default function AddListing() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createBoardingHouse = useCreateBoardingHouse();

  const [formData, setFormData] = useState<ListingFormData>({
    name: "",
    description: "",
    address: "",
    barangay: "Tanza",
    latitude: "",
    longitude: "",
    priceMin: "",
    priceMax: "",
    totalRooms: "0",
    genderPolicy: "mixed",
    photos: "",
    amenities: "",
    rules: "",
    contactEmail: "",
    contactPhone: "",
    socialMediaUrl: "",
  });

  const [photoList, setPhotoList] = useState<string[]>([]);
  const [currentPhoto, setCurrentPhoto] = useState("");

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (user?.role !== "owner") {
    return <Redirect to="/" />;
  }

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle photo file upload
  const handlePhotoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const base64Files: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file is an image
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Invalid file",
            description: `${file.name} is not an image file. Please upload image files only.`,
            variant: "destructive",
          });
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} is larger than 5MB. Please upload smaller images.`,
            variant: "destructive",
          });
          continue;
        }

        const base64 = await fileToBase64(file);
        base64Files.push(base64);
      }

      if (base64Files.length > 0) {
        setPhotoList([...photoList, ...base64Files]);
        toast({ 
          title: "Photos uploaded successfully", 
          description: `${base64Files.length} image(s) added.` 
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process images. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddPhoto = () => {
    if (currentPhoto.trim()) {
      setPhotoList([...photoList, currentPhoto.trim()]);
      setCurrentPhoto("");
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoList(photoList.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a boarding house name.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.address.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an address.",
        variant: "destructive",
      });
      return;
    }

    const priceMin = parseInt(formData.priceMin);
    const priceMax = parseInt(formData.priceMax);

    if (isNaN(priceMin) || isNaN(priceMax) || priceMin < 0 || priceMax < 0) {
      toast({
        title: "Validation Error",
        description: "Please enter valid price values.",
        variant: "destructive",
      });
      return;
    }

    if (priceMin > priceMax) {
      toast({
        title: "Validation Error",
        description: "Minimum price cannot be greater than maximum price.",
        variant: "destructive",
      });
      return;
    }

    const listingData = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      address: formData.address.trim(),
      barangay: formData.barangay,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      priceMin,
      priceMax,
      totalRooms: Math.max(0, parseInt(formData.totalRooms) || 0),
      genderPolicy: formData.genderPolicy as CreateBoardingHouseBodyGenderPolicy,
      photos: photoList,
      amenities: formData.amenities
        ? formData.amenities.split(",").map((a) => a.trim()).filter((a) => a)
        : [],
      rules: formData.rules.trim() || null,
      contactEmail: formData.contactEmail.trim() || null,
      contactPhone: formData.contactPhone.trim() || null,
      socialMediaUrl: formData.socialMediaUrl.trim() || null,
    };

    createBoardingHouse.mutate(
      { data: listingData },
      {
        onSuccess: () => {
          toast({
            title: "Success!",
            description: "Your boarding house listing has been created. It's pending approval.",
          });
          queryClient.invalidateQueries({
            queryKey: getGetMyBoardingHousesQueryKey(),
          });
          setLocation("/owner");
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error?.message || "Failed to create listing. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const genderPolicies = [
    { value: "mixed", label: "Mixed (Male and Female)" },
    { value: "male_only", label: "Male Only" },
    { value: "female_only", label: "Female Only" },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          className="p-0 h-auto text-slate-600 hover:text-slate-900"
          onClick={() => setLocation("/owner")}
        >
          <ChevronLeft className="h-5 w-5 mr-1" /> Back to Dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Add New Boarding House</CardTitle>
          <p className="text-slate-600 text-sm mt-2">
            Fill in the details of your boarding house. Your listing will be pending approval.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Basic Information Section */}
          <div className="space-y-4 pb-6 border-b">
            <h3 className="font-semibold text-slate-900">Basic Information</h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Boarding House Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Sunshine Boarding House"
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell potential tenants about your boarding house..."
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address"
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Barangay *
                </label>
                <select
                  value={formData.barangay}
                  onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-100"
                >
                  {BARANGAYS.map((barangay) => (
                    <option key={barangay} value={barangay}>
                      {barangay}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="e.g., 14.5994"
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="e.g., 120.9842"
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-100"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Rooms Section */}
          <div className="space-y-4 pb-6 border-b">
            <h3 className="font-semibold text-slate-900">Pricing & Room Information</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Minimum Price (Monthly) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.priceMin}
                  onChange={(e) => setFormData({ ...formData, priceMin: e.target.value })}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Maximum Price (Monthly) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.priceMax}
                  onChange={(e) => setFormData({ ...formData, priceMax: e.target.value })}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Total Number of Rooms
              </label>
              <input
                type="number"
                min="0"
                value={formData.totalRooms}
                onChange={(e) => setFormData({ ...formData, totalRooms: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-100"
              />
              <p className="text-xs text-slate-500 mt-1">You can manage individual rooms after creating the listing</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Gender Policy
              </label>
              <select
                value={formData.genderPolicy}
                onChange={(e) => setFormData({ ...formData, genderPolicy: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-100"
              >
                {genderPolicies.map((policy) => (
                  <option key={policy.value} value={policy.value}>
                    {policy.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Photos Section */}
          <div className="space-y-4 pb-6 border-b">
            <h3 className="font-semibold text-slate-900">Photos</h3>

            <div className="space-y-3">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                <Upload className="h-6 w-6 mx-auto text-slate-400 mb-2" />
                <p className="text-xs text-slate-500 mb-2">Click to upload photos of your boarding house</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoFileUpload}
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

              <p className="text-xs text-slate-500">Supported formats: JPG, PNG, GIF, WebP. Maximum 5MB per image.</p>
            </div>

            {photoList.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Added Photos ({photoList.length})</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {photoList.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded border border-slate-200"
                        onError={(e) => {
                          e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f3f4f6' width='100' height='100'/%3E%3Ctext x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='12' fill='%239ca3af'%3EImage%3C/text%3E%3C/svg%3E";
                        }}
                      />
                      <button
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Amenities & Contact Section */}
          <div className="space-y-4 pb-6 border-b">
            <h3 className="font-semibold text-slate-900">Amenities & Contact</h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Amenities (comma-separated)
              </label>
              <input
                type="text"
                value={formData.amenities}
                onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                placeholder="e.g., WiFi, Parking, Laundry, Study Room, Kitchen"
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="contact@example.com"
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="09XX-XXX-XXXX"
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Social Media URL (Facebook, etc.)
              </label>
              <input
                type="url"
                value={formData.socialMediaUrl}
                onChange={(e) => setFormData({ ...formData, socialMediaUrl: e.target.value })}
                placeholder="https://facebook.com/yourbh"
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-100"
              />
            </div>
          </div>

          {/* Rules Section */}
          <div className="space-y-4 pb-6">
            <h3 className="font-semibold text-slate-900">House Rules</h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                House Rules & Policies
              </label>
              <textarea
                value={formData.rules}
                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                placeholder="List any house rules or policies (e.g., No guests after 10 PM, Quiet hours, etc.)"
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-100"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-initial"
              onClick={handleSubmit}
              disabled={createBoardingHouse.isPending}
            >
              {createBoardingHouse.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Listing
                </>
              )}
            </Button>

            <Button
              variant="outline"
              className="flex-1 sm:flex-initial"
              onClick={() => setLocation("/owner")}
              disabled={createBoardingHouse.isPending}
            >
              Cancel
            </Button>
          </div>

          <p className="text-xs text-slate-500 text-center">
            * Required fields. Your listing will be pending admin approval before it appears to students.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
