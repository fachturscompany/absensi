"use client"

import React, { useState, useEffect } from "react"
import { Calendar, Info, MapPin, Loader2, Trash2, Maximize, Search } from "lucide-react"
import { SettingsHeader, SettingTab, SettingsContentLayout } from "@/components/settings/SettingsHeader"
import type { SidebarItem } from "@/components/settings/SettingsSidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getGeofences, createGeofence, deleteGeofence } from "@/action/geofence"
import { toggleDeviceStatus } from "@/action/attendance_device"
import { getCurrentUserOrganization } from "@/action/organization-settings"
import { toast } from "sonner"
import dynamic from "next/dynamic"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const GeofenceMap = dynamic(() => import("@/components/settings/GeofenceMap"), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-slate-400 text-sm">
            Loading Map...
        </div>
    )
})

export default function GeofencingPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [isFullscreenMap, setIsFullscreenMap] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [isSearching, setIsSearching] = useState(false)
    const [organizationId, setOrganizationId] = useState<string | null>(null)
    const [geofences, setGeofences] = useState<any[]>([])
    
    // Form state
    const [name, setName] = useState("")
    const [radius, setRadius] = useState("100")
    const [latitude, setLatitude] = useState("")
    const [longitude, setLongitude] = useState("")
    const [location, setLocation] = useState("")

    const tabs: SettingTab[] = [
        { label: "CALENDAR", href: "/settings/Calender", active: false },
        { label: "JOB SITES", href: "/settings/Job-sites", active: false },
        { label: "MAP", href: "/settings/Map", active: true },
    ]

    const sidebarItems: SidebarItem[] = [
        { id: "track-locations", label: "Track locations", href: "/settings/Map" },
        { id: "geofencing", label: "Geofencing", href: "/settings/Map/geofencing" },
        { id: "schedule", label: "Tracking schedule", href: "/settings/Map/schedule" },
    ]

    useEffect(() => {
        const loadInit = async () => {
            setIsLoading(true)
            try {
                const orgRes = await getCurrentUserOrganization() as any
                const orgId = orgRes?.data?.id || orgRes?.id || null
                setOrganizationId(orgId)
                if (orgId) {
                    const res = await getGeofences(orgId)
                    if (res.success) {
                        setGeofences(res.data || [])
                    }
                } else {
                    toast.error("Could not identify your organization. Please check your connection.")
                }
            } catch (error) {
                console.error("Error loading geofences:", error)
                toast.error("Failed to load geofences")
            } finally {
                setIsLoading(false)
            }
        }
        loadInit()
    }, [])

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchQuery.trim()) return

        setIsSearching(true)
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`)
            const data = await response.json()
            if (data && data.length > 0) {
                const { lat, lon, display_name } = data[0]
                setLatitude(parseFloat(lat).toFixed(6))
                setLongitude(parseFloat(lon).toFixed(6))
                if (!name) setName(display_name.split(',')[0])
                toast.success(`Found: ${display_name.split(',')[0]}`)
            } else {
                toast.error("Location not found")
            }
        } catch (error) {
            toast.error("Error searching for location")
        } finally {
            setIsSearching(false)
        }
    }

    const handleCreate = async () => {
        console.log("handleCreate clicked, organizationId:", organizationId);
        if (!organizationId) {
            toast.error("Organization ID is missing. Please refresh the page.")
            return
        }
        if (!name.trim()) {
            toast.error("Please enter a location name")
            return
        }

        setIsCreating(true)
        try {
            const res = await createGeofence({
                organization_id: organizationId,
                device_name: name,
                radius_meters: parseInt(radius) || 100,
                latitude: latitude ? parseFloat(latitude) : undefined,
                longitude: longitude ? parseFloat(longitude) : undefined,
                location: location.trim() || undefined
            })

            if (res.success) {
                toast.success("Geofence created successfully")
                setName("")
                setRadius("100")
                setLatitude("")
                setLongitude("")
                setLocation("")
                // Reload list
                const listRes = await getGeofences(organizationId)
                if (listRes.success) setGeofences(listRes.data || [])
            } else {
                toast.error(res.message || "Failed to create geofence")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsCreating(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this geofence?")) return

        try {
            const res = await deleteGeofence(id)
            if (res.success) {
                toast.success("Geofence deleted")
                setGeofences(prev => prev.filter(g => g.id !== id))
            } else {
                toast.error("Failed to delete geofence")
            }
        } catch (error) {
            toast.error("An error occurred")
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <SettingsHeader
                title="Schedules"
                Icon={Calendar}
                tabs={tabs}
                sidebarItems={sidebarItems}
                activeItemId="geofencing"
            />
            <SettingsContentLayout sidebarItems={sidebarItems} activeItemId="geofencing">
                <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                    <div className="flex items-center gap-1 mb-2">
                        <span className="text-[11px] font-normal text-gray-500 uppercase tracking-wider">
                            GEOFENCING
                        </span>
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                    </div>

                    <p className="text-sm text-gray-600 mb-8">
                        Create virtual perimeters and get notified when members enter or leave specific locations.
                    </p>

                    <div className="max-w-5xl space-y-8">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                                    <div className="flex items-center justify-between gap-4 mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-slate-200/50 flex items-center justify-center shrink-0">
                                                <MapPin className="h-6 w-6 text-slate-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-medium text-slate-900">Add New Geofence</h3>
                                                <p className="text-sm text-slate-500">Pick a location on the map or enter coordinates</p>
                                            </div>
                                        </div>
                                        <Button 
                                            className="flex gap-2 items-center bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all active:scale-95"
                                            onClick={() => setIsFullscreenMap(true)}
                                        >
                                            <Maximize className="h-4 w-4" />
                                            FULL SCREEN MAP
                                        </Button>
                                    </div>

                            <div className="space-y-6">
                                {/* Search Bar - New Position outside map for 100% visibility */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase">1. Search Location</Label>
                                    <form onSubmit={handleSearch} className="relative group">
                                        <Input 
                                            placeholder="Type a city or place (e.g. Jakarta, Menteng Central...)" 
                                            className="h-11 pl-11 bg-white border-slate-200 shadow-sm focus:ring-2 focus:ring-slate-900 transition-all font-medium"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                                            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                        </div>
                                        <Button 
                                            type="submit"
                                            variant="secondary"
                                            size="sm"
                                            disabled={isSearching}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-100 hover:bg-slate-200 text-slate-900 h-7 border border-slate-200 px-3"
                                        >
                                            {isSearching ? "Searching..." : "Go"}
                                        </Button>
                                    </form>
                                    <p className="text-[11px] text-slate-400 italic pl-1">Press Enter or click Go to search for a location</p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase">2. Fine-tune on Map</Label>
                                    {/* Mini Map */}
                                    <div className="h-[350px] w-full bg-white rounded-lg border border-slate-200 overflow-hidden shadow-inner relative">
                                        <GeofenceMap 
                                            lat={latitude ? parseFloat(latitude) : null}
                                            lng={longitude ? parseFloat(longitude) : null}
                                            radius={parseInt(radius) || 100}
                                            onLocationChange={(newLat, newLng) => {
                                                setLatitude(newLat.toFixed(6))
                                                setLongitude(newLng.toFixed(6))
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="location-name">Location Name</Label>
                                        <Input 
                                            id="location-name" 
                                            placeholder="e.g. Main Office" 
                                            className="h-11" 
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="radius">Radius (meters)</Label>
                                        <Input 
                                            id="radius" 
                                            type="number" 
                                            placeholder="100" 
                                            className="h-11" 
                                            value={radius}
                                            onChange={(e) => setRadius(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="latitude">Latitude</Label>
                                        <Input 
                                            id="latitude" 
                                            placeholder="-6.123456" 
                                            className="h-11" 
                                            value={latitude}
                                            onChange={(e) => setLatitude(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="longitude">Longitude</Label>
                                        <Input 
                                            id="longitude" 
                                            placeholder="106.123456" 
                                            className="h-11" 
                                            value={longitude}
                                            onChange={(e) => setLongitude(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="detailed-location">Detailed Address / Location (Optional)</Label>
                                    <Input 
                                        id="detailed-location" 
                                        placeholder="e.g. Jl. Merdeka No. 123, Jakarta" 
                                        className="h-11" 
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                    />
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button 
                                        className="w-full md:w-48 h-11 bg-slate-900 hover:bg-slate-800 text-white"
                                        onClick={handleCreate}
                                        disabled={isCreating}
                                    >
                                        {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Geofence"}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-slate-900 uppercase tracking-wider">Active Geofences</h3>
                            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-sm overflow-hidden">
                                {isLoading ? (
                                    <div className="p-12 flex justify-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                                    </div>
                                ) : geofences.length > 0 ? (
                                    geofences.map((geo) => (
                                        <div key={geo.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                                            {/* Name - Takes fixed space or flexible */}
                                            <div className="flex-[1.5] min-w-0">
                                                <div className="text-sm font-semibold text-slate-900 truncate">{geo.device_name}</div>
                                            </div>
                                            
                                            {/* Device Code Badge */}
                                            <div className="flex-1 hidden md:block">
                                                <Badge variant="outline" className="bg-slate-50 text-slate-500 font-mono text-[10px] h-6 px-2 shrink-0 border-slate-200">
                                                    {geo.device_code}
                                                </Badge>
                                            </div>

                                            {/* Coordinates */}
                                            <div className="flex-[2] hidden lg:block">
                                                <div className="text-[11px] text-slate-400 font-mono truncate">
                                                    {geo.latitude && geo.longitude ? `${geo.latitude}, ${geo.longitude}` : "-"}
                                                </div>
                                            </div>

                                            {/* Radius */}
                                            <div className="flex-1 hidden sm:block">
                                                <div className="text-xs text-slate-500">
                                                    {geo.radius_meters}m
                                                </div>
                                            </div>

                                            {/* Type Badge */}
                                            <div className="flex-[2] hidden xl:block">
                                                <Badge variant="outline" className="bg-white text-slate-400 font-normal text-[10px] h-6 px-2 shrink-0 border-slate-200">
                                                    Geofence Virtual Perimeter
                                                </Badge>
                                            </div>

                                            {/* Status & Actions - Right-aligned */}
                                            <div className="flex items-center gap-6 shrink-0 ml-auto">
                                                <div className="flex items-center gap-3">
                                                    <Switch 
                                                        checked={geo.is_active}
                                                        onCheckedChange={async (checked) => {
                                                            const res = await toggleDeviceStatus(geo.id, checked);
                                                            if (res.success) {
                                                                toast.success(`Geofence ${checked ? 'activated' : 'deactivated'}`);
                                                                setGeofences(prev => prev.map(g => g.id === geo.id ? { ...g, is_active: checked } : g));
                                                            } else {
                                                                toast.error("Failed to update status");
                                                            }
                                                        }}
                                                    />
                                                    <Badge 
                                                        variant="outline" 
                                                        className={cn(
                                                            "text-[10px] h-6 px-2 min-w-[60px] flex justify-center uppercase font-bold border-0",
                                                            geo.is_active 
                                                                ? "bg-emerald-100 text-emerald-700" 
                                                                : "bg-slate-100 text-slate-500"
                                                        )}
                                                    >
                                                        {geo.is_active ? "Active" : "Inactive"}
                                                    </Badge>
                                                </div>

                                                <button 
                                                    onClick={() => handleDelete(geo.id)}
                                                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center py-12 text-sm text-slate-500 italic">
                                        No active geofences found. Create one above to get started.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </SettingsContentLayout>

            {/* Full Screen Map Overlay */}
            {isFullscreenMap && (
                <div className="fixed inset-0 z-[100000] bg-white flex flex-col">
                    <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                <MapPin className="h-4 w-4 text-slate-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Pick Geofence Location</h3>
                                <p className="text-[11px] text-slate-500 uppercase font-medium">Full Screen Mode</p>
                            </div>
                        </div>
                        <Button 
                            variant="secondary" 
                            className="bg-slate-900 text-white hover:bg-slate-800"
                            onClick={() => setIsFullscreenMap(false)}
                        >
                            DONE PICKING
                        </Button>
                    </div>
                    <div className="flex-1 relative">
                        <GeofenceMap 
                            lat={latitude ? parseFloat(latitude) : null}
                            lng={longitude ? parseFloat(longitude) : null}
                            radius={parseInt(radius) || 100}
                            onLocationChange={(newLat, newLng) => {
                                setLatitude(newLat.toFixed(6))
                                setLongitude(newLng.toFixed(6))
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
