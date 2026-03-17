"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMapEvents,
  useMap,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./leaflet-fix.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Loader2, Locate, LocateFixed, LocateOff } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { attendanceLogger } from '@/lib/logger';
import { Card } from "@/components/ui/card";

// Fix untuk icon marker leaflet
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapComponentProps {
  latitude: number | null;
  longitude: number | null;
  radius: number;
  onMapClick?: (lat: number, lng: number) => void;
  onLoad?: () => void;
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function MapCenterController({
  latitude,
  longitude,
}: {
  latitude: number | null;
  longitude: number | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (latitude && longitude) {
      map.setView([latitude, longitude], 15);
    }
  }, [latitude, longitude, map]);

  return null;
}

export default function MapComponent({
  latitude,
  longitude,
  radius,
  onMapClick,
  onLoad,
}: MapComponentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [key, setKey] = useState(0);
  const [locationPermission, setLocationPermission] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [isUserLocationCentered, setIsUserLocationCentered] = useState(false);
  const [alertDialog, setAlertDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
  }>({
    open: false,
    title: "",
    description: "",
  });

  const defaultCenter: [number, number] = [-7.9551, 112.7269]; // Surabaya
  const center: [number, number] =
    latitude && longitude ? [latitude, longitude] : defaultCenter;

  useEffect(() => {
    console.log("DEBUG: MapComponent MOUNTED - Version 2.0 (Floating Controls)");
    if (onLoad) {
      onLoad();
    }

    // Check initial permission state
    if ("geolocation" in navigator) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        setLocationPermission(result.state);
        result.onchange = () => {
          setLocationPermission(result.state);
        };
      });
    } else {
      setLocationPermission('denied');
    }
  }, [onLoad]);

  // Listener to reset "Centered" state when user manually moves map
  function MapInteractionHandler() {
    useMapEvents({
      dragstart: () => setIsUserLocationCentered(false),
      zoomstart: () => setIsUserLocationCentered(false),
    });
    return null;
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      // Menggunakan Nominatim OSM API (free, no API key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        if (onMapClick) {
          onMapClick(parseFloat(lat), parseFloat(lon));
          setKey((prev) => prev + 1);
        }
      } else {
        setAlertDialog({
          open: true,
          title: "Location Not Found",
          description: "We couldn't find the location you're looking for. Please try a different search term.",
        });
      }
    } catch (error) {
      attendanceLogger.error("Search error:", error);
      setAlertDialog({
        open: true,
        title: "Search Failed",
        description: "Failed to search location. Please check your internet connection.",
      });
    } finally {
      setSearching(false);
    }
  };

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (onMapClick) {
            onMapClick(position.coords.latitude, position.coords.longitude);
            setKey((prev) => prev + 1);
          }
          setLocationLoading(false);
          setIsUserLocationCentered(true);
          setLocationPermission('granted');
        },
        (error) => {
          attendanceLogger.error("Geolocation error:", {
            code: error.code,
            message: error.message,
          });
          setLocationLoading(false);
          setIsUserLocationCentered(false);

          if (error.code === error.PERMISSION_DENIED) {
            setLocationPermission('denied');
          }

          setAlertDialog({
            open: true,
            title: "Location Access Denied",
            description: "Failed to get current location. Please enable location services.",
          });
        }
      );
    } else {
      setLocationPermission('denied');
      setAlertDialog({
        open: true,
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support geolocation.",
      });
    }
  };

  const getLocationIcon = () => {
    if (locationLoading) return <Loader2 className="h-5 w-5 animate-spin" />;
    if (locationPermission === 'denied') return <LocateOff className="h-5 w-5 text-destructive" />; // Red slash if denied
    if (isUserLocationCentered) return <LocateFixed className="h-5 w-5 text-primary" />; // Filled target if centered
    return <Locate className="h-5 w-5 text-foreground" />; // Outline arrow if available but not centered
  };

  return (
    <div className="relative group overflow-hidden border shadow-sm h-[500px]">
      {/* Floating Controls */}
      <div className="absolute top-2 left-2 right-2 z-[500] pointer-events-none flex justify-between gap-2">
        {/* Search Bar */}
        <Card className="pointer-events-auto flex flex-row items-center p-0.5 shadow-lg border-0 bg-white/90 backdrop-blur-sm w-full max-w-sm">

          <Input
            className="border-0 shadow-none focus-visible:ring-0 bg-transparent h-9"
            placeholder="Search place..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:cursor-pointer hover:bg-black/5 rounded-full"
            onClick={handleSearch}
            disabled={searching}
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <div className="sr-only">Search</div>}
            {!searching && <span className="sr-only">Go</span>}
            {!searching && <Search className="h-3 w-3" />}
          </Button>
        </Card>

        {/* My Location */}
        <Button
          variant="secondary"
          size="icon"
          className="pointer-events-auto h-10 w-10 rounded-xl shadow-lg bg-white/90 backdrop-blur-sm hover:bg-white border-0"
          onClick={getCurrentLocation}
          disabled={locationLoading}
          title={
            locationPermission === 'denied'
              ? "Location access denied"
              : isUserLocationCentered
                ? "You are here"
                : "Show current location"
          }
        >
          {getLocationIcon()}
        </Button>
      </div>

      {/* Selected Info Overlay - Bottom Left */}
      {latitude && longitude && (
        <div className="absolute bottom-2 left-2 z-[500] pointer-events-none">
          <div className="pointer-events-auto bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md text-xs font-mono border flex items-center gap-2">
            <MapPin className="h-3 w-3 text-red-500" />
            <span>{latitude.toFixed(5)}, {longitude.toFixed(5)}</span>
            <span className="text-muted-foreground">|</span>
            <span>R: {radius}m</span>
          </div>
        </div>
      )}

      <MapContainer
        key={`map-${key}`}
        center={center}
        zoom={latitude && longitude ? 15 : 12}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        attributionControl={false}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <ZoomControl position="bottomright" />

        <MapInteractionHandler />
        <MapClickHandler onMapClick={onMapClick} />
        <MapCenterController latitude={latitude} longitude={longitude} />

        {latitude && longitude && (
          <>
            <Marker
              position={[latitude, longitude]}
              icon={icon}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const position = marker.getLatLng();
                  if (onMapClick) {
                    onMapClick(position.lat, position.lng);
                  }
                },
              }}
            />
            <Circle
              center={[latitude, longitude]}
              radius={radius}
              pathOptions={{
                color: "hsl(var(--primary))",
                fillColor: "hsl(var(--primary))",
                fillOpacity: 0.2,
              }}
            />
          </>
        )}
      </MapContainer>

      <AlertDialog open={alertDialog.open} onOpenChange={(open) => setAlertDialog({ ...alertDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
