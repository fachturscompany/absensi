"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

interface LocationMapProps {
  latitude: number | null;
  longitude: number | null;
  radius: number;
  onMapClick?: (lat: number, lng: number) => void;
}

export default function LocationMap(props: LocationMapProps) {
  const Map = useMemo(
    () =>
      dynamic(() => import("./map-component"), {
        loading: () => <Skeleton className="w-full h-[500px] rounded-lg" />,
        ssr: false,
      }),
    []
  );

  return (
    <div style={{ minHeight: '500px' }}>
      <Map {...props} />
    </div>
  );
}
