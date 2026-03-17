"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

const iconUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png"
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png"
const shadowUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png"

function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap()

    useEffect(() => {
        map.setView(center)
    }, [center, map])

    return null
}

interface Visit {
    id: string
    memberName: string
    locationName: string
    address: string
    coordinates?: {
        lat: number
        lng: number
    }
}

interface VisitsMapProps {
    visits: Visit[]
}

export default function VisitsMap({ visits }: VisitsMapProps) {
    useEffect(() => {
         
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
            iconUrl,
            iconRetinaUrl,
            shadowUrl,
        })
    }, [])

    const validVisits = visits.filter(v => v.coordinates)

    const center: [number, number] = validVisits[0]?.coordinates
        ? [validVisits[0].coordinates!.lat, validVisits[0].coordinates!.lng]
        : [-6.2088, 106.8456]

    return (
        <div className="h-[600px] w-full rounded-lg overflow-hidden border shadow-sm z-0 relative">
            <MapContainer
                center={[-6.2088, 106.8456]}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
            >
                <ChangeView center={center} />

                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {validVisits.map(v => (
                    <Marker
                        key={v.id}
                        position={[v.coordinates!.lat, v.coordinates!.lng]}
                    >
                        <Popup>
                            <div className="p-1">
                                <h3 className="font-bold text-sm">{v.locationName}</h3>
                                <p className="text-xs text-gray-600">{v.memberName}</p>
                                <p className="text-xs text-gray-500 mt-1">{v.address}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    )
}
