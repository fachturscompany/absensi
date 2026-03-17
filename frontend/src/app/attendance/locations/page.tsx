"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllAttendanceDevices, toggleDeviceStatus } from "@/action/attendance_device";
import { IAttendanceDevice } from "@/interface";
import { useHydration } from "@/hooks/useHydration";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Plus, Eye, Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { LocationStats } from "./_components/location-stats";
import { PaginationFooter } from "@/components/customs/pagination-footer";
import { PageSkeleton } from "@/components/ui/loading-skeleton";

export default function LocationsPage() {
  const router = useRouter();
  const { isHydrated, organizationId } = useHydration();
  const [devices, setDevices] = useState<IAttendanceDevice[]>([]);

  // Search State
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (!isHydrated || !organizationId) {
      return
    }

    const fetchData = async () => {
      try {
        const devicesRes = await getAllAttendanceDevices(organizationId);

        if (devicesRes.success && Array.isArray(devicesRes.data)) {
          setDevices(devicesRes.data as IAttendanceDevice[]);
        } else {
          console.warn('[LOCATIONS] Failed to fetch devices');
          setDevices([]);
        }
      } catch (error) {
        console.error('[LOCATIONS] Error fetching data:', error);
        toast.error('Failed to load attendance locations');
        setDevices([]);
      }
    };

    fetchData();
  }, [isHydrated, organizationId]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Derived Data
  const filteredDevices = devices.filter((device) => {
    // Exclude Geofences from this general list
    if (device.device_types?.code === 'GEOFENCE') return false;
    
    return device.device_name.toLowerCase().includes(search.toLowerCase()) ||
    device.location?.toLowerCase().includes(search.toLowerCase()) ||
    device.device_code.toLowerCase().includes(search.toLowerCase())
  });

  const activeCount = filteredDevices.filter(d => d.is_active).length;

  // Pagination Logic
  const totalRows = filteredDevices.length;
  const totalPages = Math.ceil(totalRows / pageSize);
  const paginatedDevices = filteredDevices.slice((page - 1) * pageSize, page * pageSize);
  const showingFrom = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo = Math.min(page * pageSize, totalRows);

  // Handlers
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const result = await toggleDeviceStatus(id, !currentStatus);
    if (result.success) {
      setDevices(devices.map(d =>
        d.id === id ? { ...d, is_active: !currentStatus } : d
      ));
      toast.success(`Location ${!currentStatus ? 'activated' : 'deactivated'}`);
    } else {
      toast.error(result.message || "Failed to update status");
    }
  };

  if (!isHydrated) {
    return <PageSkeleton />;
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="">
            <h1 className="text-xl font-semibold">Attendance Locations</h1>
          </div>


        </div>

        <LocationStats
          totalLocations={devices.length}
          activeLocations={activeCount}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
          <h2 className="font-semibold text-lg text-gray-700">Locations List</h2>

          <div className="grid grid-cols-5 gap-2 w-full md:w-auto md:flex">
            <div className="col-span-4 relative w-full md:w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, location..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  if (e.target.value === '') setSearch('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setSearch(searchInput);
                }}
                className="pl-10 pr-16 bg-white w-full"
              />
              {searchInput !== search && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-1/2 h-7 -translate-y-1/2 px-2 text-xs"
                  onClick={() => setSearch(searchInput)}
                >
                  Search
                </Button>
              )}
            </div>

            <Button onClick={() => router.push("/attendance/locations/new")} className="col-span-1 bg-black text-white hover:bg-black/90 shrink-0 md:w-auto px-0 md:px-4">
              <Plus className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Add</span>
            </Button>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold text-gray-600">Device Name</TableHead>
                  <TableHead className="font-semibold text-gray-600">Code</TableHead>
                  <TableHead className="font-semibold text-gray-600">Location</TableHead>
                  <TableHead className="font-semibold text-gray-600">Coordinates</TableHead>
                  <TableHead className="font-semibold text-gray-600">Radius</TableHead>
                  <TableHead className="font-semibold text-gray-600">Type</TableHead>
                  <TableHead className="font-semibold text-gray-600">Status</TableHead>
                  <TableHead className="text-right font-semibold text-gray-600">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDevices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <MapPin className="h-8 w-8 text-muted-foreground/50" />
                        <p>No locations found matching your search.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedDevices.map((device) => (
                    <TableRow key={device.id} className="even:bg-gray-50 hover:!bg-gray-200 transition-colors">
                      <TableCell className="font-medium text-gray-900">
                        {device.device_name}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded border border-gray-200 text-gray-700">
                          {device.device_code}
                        </code>
                      </TableCell>
                      <TableCell className="text-gray-600">{device.location || "-"}</TableCell>
                      <TableCell>
                        {device.latitude && device.longitude ? (
                          <span className="text-xs text-gray-500 font-mono">
                            {Number(device.latitude).toFixed(6)}, {Number(device.longitude).toFixed(6)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {device.radius_meters ? `${device.radius_meters}m` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal text-gray-600 border-gray-300">
                          {device.device_types?.name || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={device.is_active}
                            onCheckedChange={() => handleToggleStatus(device.id, device.is_active)}
                          />
                          <Badge variant={device.is_active ? "default" : "secondary"} className={device.is_active ? "bg-green-600 hover:bg-green-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}>
                            {device.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/attendance/locations/${device.id}`)}
                          className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100 hover:cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <PaginationFooter
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          from={showingFrom}
          to={showingTo}
          total={totalRows}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          className="border-none shadow-none bg-transparent p-0"
        />
      </div>
    </div>
  );
}
