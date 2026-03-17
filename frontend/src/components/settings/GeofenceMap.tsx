"use client"

import React, { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap, ZoomControl } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Fix Leaflet marker icons
const iconUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png"
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png"
const shadowUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png"

interface GeofenceMapProps {
    lat: number | null
    lng: number | null
    radius: number
    onLocationChange: (lat: number, lng: number) => void
}

function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap()
    useEffect(() => {
        if (center[0] !== 0 && center[1] !== 0) {
            map.setView(center, map.getZoom())
        }
    }, [center, map])
    return null
}

function MapEvents({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onLocationChange(e.latlng.lat, e.latlng.lng)
        },
    })
    return null
}

export default function GeofenceMap({ lat, lng, radius, onLocationChange }: GeofenceMapProps) {
    useEffect(() => {
        // Fix for standard leaflet icons
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
            iconUrl,
            iconRetinaUrl,
            shadowUrl,
        })
    }, [])

    const defaultCenter: [number, number] = [-6.2088, 106.8456] // Jakarta
    const center: [number, number] = lat && lng ? [lat, lng] : defaultCenter

    return (
        <div className="h-full w-full relative min-h-[300px] z-0">
            <MapContainer
                center={center}
                zoom={15}
                zoomControl={false}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <ZoomControl position="topright" />
                <MapEvents onLocationChange={onLocationChange} />
                <ChangeView center={center} />

                {lat && lng && (
                    <>
                        <Marker position={[lat, lng]} />
                        <Circle 
                            center={[lat, lng]}
                            radius={radius}
                            pathOptions={{
                                fillColor: '#3b82f6',
                                fillOpacity: 0.2,
                                color: '#3b82f6',
                                weight: 1
                            }}
                        />
                    </>
                )}
            </MapContainer>

        </div>
    )
}
