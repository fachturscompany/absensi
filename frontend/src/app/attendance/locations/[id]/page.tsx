"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getAttendanceDeviceById, getDeviceTypes, updateAttendanceDevice } from "@/action/attendance_device";
import { IAttendanceDevice, IDeviceType } from "@/interface";
import { useHydration } from "@/hooks/useHydration";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, MapPin, Info, Crosshair, Settings, Smartphone, Save } from "lucide-react";
import LocationMap from "../_components/location-map";
import { Separator } from "@/components/ui/separator";
import { PageSkeleton } from "@/components/ui/loading-skeleton";

export default function EditLocationPage() {
  const params = useParams();
  const id = params.id as string;

  const router = useRouter();
  const { isHydrated, organizationId } = useHydration();

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const [deviceTypes, setDeviceTypes] = useState<IDeviceType[]>([]);

  const [formData, setFormData] = useState({
    device_name: "",
    device_code: "",
    location: "",
    latitude: "",
    longitude: "",
    radius_meters: 50,
    allow_selfie: true,
    require_location: true,
    max_distance: 50,
  });

  // Fetch Data
  useEffect(() => {
    if (!isHydrated || !organizationId) return;

    const fetchData = async () => {
      try {
        const [deviceRes, typesRes] = await Promise.all([
          getAttendanceDeviceById(id),
          getDeviceTypes()
        ]);

        if (deviceRes.success && deviceRes.data) {
          const d = deviceRes.data as IAttendanceDevice;


          // Verify organization ownership
          if (String(d.organization_id) !== String(organizationId)) {
            toast.error("Unauthorized access to this location");
            router.push("/attendance/locations");
            return;
          }

          // Initialize form
          setFormData({
            device_name: d.device_name || "",
            device_code: d.device_code || "",
            location: d.location || "",
            latitude: d.latitude || "",
            longitude: d.longitude || "",
            radius_meters: d.radius_meters || 50,
            allow_selfie: d.configuration?.allow_selfie ?? true,
            require_location: d.configuration?.require_location ?? true,
            max_distance: d.configuration?.max_distance || 50,
          });
        } else {
          toast.error("Location not found");
          router.push("/attendance/locations");
        }

        if (typesRes.success && Array.isArray(typesRes.data)) {
          setDeviceTypes(typesRes.data as IDeviceType[]);
        }
      } catch (error) {
        console.error("Error fetching location data:", error);
        toast.error("Failed to load location data");
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [id, isHydrated, organizationId, router]);

  // Auto-detect mobile device type ID
  const mobileDeviceType = deviceTypes.find(
    (type) => type.category?.toLowerCase() === "mobile" || type.name?.toLowerCase().includes("mobile")
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!mobileDeviceType) {
        toast.error("Mobile device type not found in system");
        return;
      }

      const payload = {
        organization_id: Number(organizationId),
        device_type_id: Number(mobileDeviceType.id),
        device_code: formData.device_code,
        device_name: formData.device_name,
        location: formData.location || undefined,
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined,
        radius_meters: formData.radius_meters || undefined,
        is_active: true,
        configuration: {
          allow_selfie: formData.allow_selfie,
          require_location: formData.require_location,
          max_distance: formData.max_distance,
        },
      };

      const result = await updateAttendanceDevice(id, payload);

      if (result.success) {
        toast.success("Location updated successfully");
        router.push("/attendance/locations");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to update location");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setFormData({
      ...formData,
      latitude: lat.toFixed(8),
      longitude: lng.toFixed(8),
    });
  };

  if (dataLoading) {
    return <PageSkeleton />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Edit Location
          </h1>
          <p className="text-muted-foreground">
            Configure attendance settings and geofencing for this location.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="bg-black hover:bg-black/90">
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Map */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Geofencing Area</CardTitle>
                  <CardDescription>
                    Click on the map to set the center point of the attendance zone.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-[500px] relative">
              <div className="absolute inset-0">
                <LocationMap
                  latitude={formData.latitude ? Number(formData.latitude) : null}
                  longitude={formData.longitude ? Number(formData.longitude) : null}
                  radius={formData.radius_meters}
                  onMapClick={handleMapClick}
                />
              </div>
            </CardContent>
            <div className="p-4 border-t bg-white z-10 relative">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="radius_meters" className="mb-2 block text-sm font-medium">
                    Radius: <span className="text-primary font-bold">{formData.radius_meters}m</span>
                  </Label>
                  <input
                    type="range"
                    id="radius_meters"
                    min="10"
                    max="1000"
                    step="10"
                    value={formData.radius_meters}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        radius_meters: Number(e.target.value),
                      })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Adjust the allowed distance from the center point.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Settings */}
        <div className="space-y-6">

          {/* General Information */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">General Information</CardTitle>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="device_name">Location Name *</Label>
                <Input
                  id="device_name"
                  required
                  value={formData.device_name}
                  onChange={(e) =>
                    setFormData({ ...formData, device_name: e.target.value })
                  }
                  placeholder="e.g., Head Office"
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="device_code">Location Code *</Label>
                <Input
                  id="device_code"
                  required
                  value={formData.device_code}
                  onChange={(e) =>
                    setFormData({ ...formData, device_code: e.target.value })
                  }
                  placeholder="e.g., HO-001"
                  className="font-mono text-sm bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Address / Description</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="Optional address details"
                  className="bg-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Coordinates */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Crosshair className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Coordinates</CardTitle>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="latitude" className="text-xs text-muted-foreground">Latitude</Label>
                  <Input
                    id="latitude"
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData({ ...formData, latitude: e.target.value })
                    }
                    placeholder="-7.98..."
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude" className="text-xs text-muted-foreground">Longitude</Label>
                  <Input
                    id="longitude"
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({ ...formData, longitude: e.target.value })
                    }
                    placeholder="112.63..."
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Configuration</CardTitle>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between py-1">
                <div className="space-y-0.5">
                  <Label htmlFor="allow_selfie" className="text-sm font-medium">Require Selfie</Label>
                  <p className="text-xs text-muted-foreground">Users must take a photo</p>
                </div>
                <Switch
                  id="allow_selfie"
                  checked={formData.allow_selfie}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, allow_selfie: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-1">
                <div className="space-y-0.5">
                  <Label htmlFor="require_location" className="text-sm font-medium">Require GPS</Label>
                  <p className="text-xs text-muted-foreground">Force GPS validation</p>
                </div>
                <Switch
                  id="require_location"
                  checked={formData.require_location}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, require_location: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Device TypInfo (Read Only) */}
          <div className="p-4 bg-gray-50/50 rounded-lg border border-gray-100">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-md">
                <Smartphone className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Mobile Attendance Point</p>
                <p className="text-xs text-gray-700 mt-1">
                  This location will be available for users to check in via their mobile devices within the specified radius.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </form>
  );
}
