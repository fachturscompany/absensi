"use client";

// @ts-ignore - pigeon-maps may not have type definitions
import { Map, Marker } from "pigeon-maps";
import { useState } from "react";

export default function DashboardMapComponent() {
    const [center, setCenter] = useState<[number, number]>([-6.2088, 106.8456]); // Jakarta coordinates
    const [zoom, setZoom] = useState(12);

    const markerColor = "#ef4444";

    // Dummy markers untuk demo
    const markers = [
        { id: 1, position: [-6.2088, 106.8456] as [number, number], name: "Kantor Pusat" },
        { id: 2, position: [-6.1751, 106.8650] as [number, number], name: "Cabang Menteng" },
        { id: 3, position: [-6.2297, 106.8177] as [number, number], name: "Cabang Kemang" },
    ];

    return (
        <div
            className="pigeon-map-container relative w-full h-full rounded-lg overflow-hidden"
            style={{ cursor: 'grab' }}
            onMouseDown={(e) => {
                if (e.currentTarget === e.target || e.currentTarget.contains(e.target as Node)) {
                    e.currentTarget.style.cursor = 'grabbing';
                }
            }}
            onMouseUp={(e) => {
                e.currentTarget.style.cursor = 'grab';
            }}
        >
            <Map
                height={500}
                center={center}
                zoom={zoom}
                onBoundsChanged={({ center, zoom }: { center: [number, number]; zoom: number }) => {
                    setCenter(center);
                    setZoom(zoom);
                }}
                attribution={false}
            >
                {markers.map((marker) => (
                    <Marker
                        key={marker.id}
                        width={50}
                        anchor={marker.position}
                        color={markerColor}
                        onClick={() => console.log(`Clicked marker: ${marker.name}`)}
                    />
                ))}
            </Map>

            {/* Map info overlay */}
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md z-10 pointer-events-none">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium">Live Map View</span>
                </div>
            </div>
        </div>
    );
}
