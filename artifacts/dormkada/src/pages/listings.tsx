import { useState } from "react";
import { Link } from "wouter";
import { useListBoardingHouses } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { MapPin, Star, Search, Map, X, Maximize2, Minimize2 } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import ImageCarousel from "@/components/ImageCarousel";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DEFAULT_CENTER: [number, number] = [13.4426, 122.0086];

type MapMode = "hidden" | "mini" | "fullscreen";

export default function Listings() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roomType, setRoomType] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [mapMode, setMapMode] = useState<MapMode>("mini");

  const { data: listingsData, isLoading } = useListBoardingHouses({
    search: searchTerm || undefined,
    roomType: roomType !== "all" ? roomType : undefined,
    priceMin: priceRange[0],
    priceMax: priceRange[1],
  });

  // The generated client types this as `BoardingHouse[]`, but some backends return
  // `{ data: BoardingHouse[] }` or other wrappers. Normalize so rendering never crashes.
  const listings = (() => {
    if (Array.isArray(listingsData)) return listingsData;
    const wrapped = listingsData as any;
    if (Array.isArray(wrapped?.data)) return wrapped.data;
    if (Array.isArray(wrapped?.items)) return wrapped.items;
    if (Array.isArray(wrapped?.results)) return wrapped.results;
    return [];
  })();

  const MapView = (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={15}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {listings.map((house) =>
        house.latitude && house.longitude ? (
          <Marker key={house.id} position={[house.latitude, house.longitude]}>
            <Popup>
              <div className="p-1 min-w-[180px]">
                <h3 className="font-bold mb-1">{house.name}</h3>
                <p className="text-xs text-slate-500 mb-2">{house.address}</p>
                <p className="font-semibold text-blue-600">₱{house.priceMin}/mo</p>
                <Button
                  asChild
                  size="sm"
                  className="w-full mt-2 h-8 text-xs text-black bg-blue-300 hover:bgblue-700"
                >
                  <Link href={`/listings/${house.id}`}>View Details</Link>
                </Button>
              </div>
            </Popup>
          </Marker>
        ) : null
      )}
    </MapContainer>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Fullscreen map overlay */}
      {mapMode === "fullscreen" && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col" style={{ top: 64 }}>
          <div className="flex items-center justify-between px-4 py-2 bg-white border-b shadow-sm">
            <span className="font-semibold text-slate-700 flex items-center gap-2">
              <Map className="h-4 w-4 text-blue-600" /> Map View — Brgy. Tanza, Boac
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setMapMode("mini")}>
                <Minimize2 className="h-4 w-4 mr-1" /> Minimize
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setMapMode("hidden")}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1">{MapView}</div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header + Filters */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Boarding Houses Near You</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                  <MapPin className="h-3 w-3 mr-1" /> Tanza, Boac
                </Badge>
                <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">
                  {listings.length} {listings.length === 1 ? "Property" : "Properties"}
                </Badge>
                <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
                  Verified Listings
                </Badge>
              </div>
            </div>

            {/* Map toggle button */}
            <Button
              variant="outline"
              className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 self-start sm:self-auto"
              onClick={() => setMapMode(mapMode === "hidden" ? "mini" : mapMode === "mini" ? "fullscreen" : "hidden")}
            >
              <Map className="h-4 w-4" />
              {mapMode === "hidden" ? "Show Map" : mapMode === "mini" ? "Expand Map" : "Hide Map"}
            </Button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by name or location..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Select value={roomType} onValueChange={setRoomType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Room Types" />
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
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Price Range</span>
                  <span className="text-sm text-blue-600 font-semibold">₱{priceRange[0].toLocaleString()} – ₱{priceRange[1].toLocaleString()}</span>
                </div>
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

        {/* Listings grid + mini map side by side when mini */}
        <div className={mapMode === "mini" ? "flex gap-6 items-start" : ""}>
          {/* Listings grid */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-16">
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
              <div className="grid grid-cols-1 gap-6">
                {listings.map((house) => (
                  <Card
                    key={house.id}
                    className="overflow-hidden hover:shadow-lg transition-all border-slate-200 group h-full flex flex-col"
                  >
                      <div className="relative h-64 w-full bg-slate-200 overflow-hidden">
                        {house.photos && house.photos.length > 0 ? (
                          <ImageCarousel
                            images={house.photos}
                            alt={house.name}
                            className="w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100">
                            <MapPin className="h-12 w-12 text-slate-300" />
                          </div>
                        )}

                        <div className="absolute top-3 left-3">
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
                          <div className="flex items-center gap-1 text-sm bg-slate-100 px-2 py-1 rounded shrink-0 ml-2">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span className="font-medium">{house.rating || "New"}</span>
                          </div>
                        </div>

                        <p className="text-sm text-slate-500 flex items-center gap-1 mb-4">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="line-clamp-1">{house.address}, {house.barangay}</span>
                        </p>

                        <div className="mt-auto pt-4 border-t flex items-end justify-between">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Starts from</p>
                            <p className="font-bold text-blue-600 text-lg">
                              ₱{house.priceMin?.toLocaleString()}<span className="text-sm text-slate-500 font-normal">/mo</span>
                            </p>
                          </div>
                          <Button
                            asChild
                            size="sm"
                            variant="secondary"
                            className="bg-blue-100 text-black-700 hover:bg-blue-400"
                          >
                            <Link href={`/listings/${house.id}`}>View Details</Link>
                          </Button>
                        </div>
                      </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Mini map panel */}
          {mapMode === "mini" && (
            <div className="hidden lg:flex flex-col shrink-0 w-80 rounded-xl overflow-hidden border border-slate-200 shadow-md sticky top-24" style={{ height: 420 }}>
              <div className="flex items-center justify-between px-3 py-2 bg-white border-b text-sm font-medium text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Map className="h-3.5 w-3.5 text-blue-600" /> Map
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setMapMode("fullscreen")}
                    className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                    title="Expand map"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setMapMode("hidden")}
                    className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                    title="Hide map"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex-1">{MapView}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
