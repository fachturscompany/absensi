"use client";


import { MapPin, Users, CheckCircle } from "lucide-react";

interface LocationStatsProps {
  totalLocations: number;
  activeLocations: number;
  totalCheckinsToday?: number;
}

export function LocationStats({
  totalLocations,
  activeLocations,
  totalCheckinsToday = 0,
}: LocationStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border rounded-lg shadow-sm bg-white">
      <div className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Locations</p>
            <p className="text-2xl font-bold">{totalLocations}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-500/10 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Active Locations</p>
            <p className="text-2xl font-bold">{activeLocations}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <Users className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Check-ins Today</p>
            <p className="text-2xl font-bold">{totalCheckinsToday}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
