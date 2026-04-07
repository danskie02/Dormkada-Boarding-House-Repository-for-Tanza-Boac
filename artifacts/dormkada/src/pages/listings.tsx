import { useState } from "react";
import { Link } from "wouter";
import { useListBoardingHouses } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { MapPin, Star, Search, Filter } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DEFAULT_CENTER: [number, number] = [13.4426, 122.0086]; // Brgy Tanza, Boac

export default function Listings() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roomType, setRoomType] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  
  const { data: listings = [], isLoading } = useListBoardingHouses({
    search: searchTerm || undefined,
    roomType: roomType !== "all" ? roomType : undefined,
    priceMin: priceRange[0],
    priceMax: priceRange[1],
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Left sidebar - Filters and List */}
      <div className="w-full md:w-1/2 lg:w-3/5 xl:w-1/2 flex flex-col h-[calc(100vh-64px)] z-10 bg-white shadow-xl">
        <div className="p-6 border-b">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Boarding Houses Near You</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                  <MapPin className="h-3 w-3 mr-1" /> Tanza, Boac
                </Badge>
                <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">
                  {listings.length} Properties
                </Badge>
                <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
                  Verified Listings
                </Badge>
              </div>
            </div>

            <div className="grid gap-4 mt-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search by name or location..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block text-slate-700">Room Type</label>
                  <Select value={roomType} onValueChange={setRoomType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="twin">Twin</SelectItem>
                      <SelectItem value="triple">Triple</SelectItem>
                      <SelectItem value="quad">Quad</SelectItem>
                      <SelectItem value="bedspacer_2">Bedspacer (2)</SelectItem>
                      <SelectItem value="bedspacer_3">Bedspacer (3+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block text-slate-700 flex justify-between">
                    <span>Price Range</span>
                    <span className="text-blue-600 font-semibold">₱{priceRange[0]} - ₱{priceRange[1]}</span>
                  </label>
                  <div className="pt-2 px-1">
                    <Slider 
                      defaultValue={[0, 10000]} 
                      max={20000} 
                      step={500}
                      value={priceRange}
                      onValueChange={(val) => setPriceRange([val[0], val[1]])}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-slate-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No properties found</h3>
              <p className="text-slate-500 mt-1">Try adjusting your filters to see more results.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchTerm("");
                  setRoomType("all");
                  setPriceRange([0, 10000]);
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {listings.map((house) => (
                <Link key={house.id} href={`/listings/${house.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer border-slate-200 group h-full flex flex-col">
                    <div className="relative h-48 w-full bg-slate-200 overflow-hidden">
                      {house.photos && house.photos.length > 0 ? (
                        <img 
                          src={house.photos[0]} 
                          alt={house.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100">
                          <HomeIcon className="h-12 w-12 text-slate-300" />
                        </div>
                      )}
                      
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        <Badge className="bg-white/90 text-slate-900 backdrop-blur-sm border-none font-semibold">
                          {house.genderPolicy === "mixed" ? "Mixed" : 
                           house.genderPolicy === "female_only" ? "Female Only" : "Male Only"}
                        </Badge>
                      </div>
                      
                      <div className="absolute top-3 right-3">
                        <Badge className={
                          house.availableRooms > 2 ? "bg-emerald-500 border-none" : 
                          house.availableRooms > 0 ? "bg-amber-500 border-none" : 
                          "bg-red-500 border-none"
                        }>
                          {house.availableRooms > 2 ? "Available" : 
                           house.availableRooms > 0 ? "Almost Full" : "Full"}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardContent className="p-4 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg leading-tight line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {house.name}
                        </h3>
                        <div className="flex items-center gap-1 text-sm bg-slate-100 px-2 py-1 rounded">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="font-medium">{house.rating || "New"}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-500 flex items-center gap-1 mb-4">
                        <MapPin className="h-3 w-3" />
                        <span className="line-clamp-1">{house.address}, {house.barangay}</span>
                      </p>
                      
                      <div className="mt-auto pt-4 border-t flex items-end justify-between">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Starts from</p>
                          <p className="font-bold text-blue-600 text-lg">₱{house.priceMin}<span className="text-sm text-slate-500 font-normal">/mo</span></p>
                        </div>
                        <Button size="sm" variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side - Map */}
      <div className="hidden md:block md:w-1/2 lg:w-2/5 xl:w-1/2 h-[calc(100vh-64px)] sticky top-16 bg-slate-200">
        <MapContainer 
          center={DEFAULT_CENTER} 
          zoom={15} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {listings.map((house) => (
            house.latitude && house.longitude ? (
              <Marker 
                key={house.id} 
                position={[house.latitude, house.longitude]}
              >
                <Popup>
                  <div className="p-1 min-w-[200px]">
                    <h3 className="font-bold mb-1">{house.name}</h3>
                    <p className="text-xs text-slate-500 mb-2">{house.address}</p>
                    <p className="font-semibold text-blue-600">₱{house.priceMin}/mo</p>
                    <Link href={`/listings/${house.id}`}>
                      <Button size="sm" className="w-full mt-2 h-8 text-xs">View Details</Button>
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ) : null
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
