"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Area, AreaChart, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface AttendanceAnalyticsProps {
  data: any;
  type: 'trend' | 'distribution' | 'status';
  loading?: boolean;
  chartType?: 'donut' | 'pie' | 'bar';
}

export function AttendanceAnalytics({ 
  data, 
  type, 
  loading = false,
  chartType = 'donut'
}: AttendanceAnalyticsProps) {

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 min-w-[160px]">
          {label && <p className="text-gray-900 dark:text-gray-100 font-semibold text-sm mb-2">{label}</p>}
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-3 text-sm py-1">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full shrink-0" 
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                <span className="text-gray-900 dark:text-gray-100 font-medium">{entry.name}</span>
              </div>
              <span className="text-gray-900 dark:text-gray-100 font-semibold">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-2 sm:space-y-3 md:space-y-4 w-full min-w-0">
        <Skeleton className="h-[100px] sm:h-[120px] md:h-[150px] lg:h-[200px] xl:h-[250px] w-full" />
      </div>
    );
  }

  // Monthly Trend Chart
  if (type === 'trend') {
    if (!data || data.length === 0) {
      return <div className="text-center py-8 text-muted-foreground">No trend data available</div>;
    }

    const chartConfig = {
      attendance: {
        label: "Present",
        color: "hsl(142.1 76.2% 36.3%)",
      },
      late: {
        label: "Late",
        color: "hsl(45 93% 58%)",
      },
    };

    return (
      <ChartContainer config={chartConfig} className="h-[100px] sm:h-[120px] md:h-[150px] lg:h-[200px] xl:h-[250px] w-full min-w-0">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="fillAttendance" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="fillLate" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(45 93% 58%)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(45 93% 58%)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
          <XAxis 
            dataKey="month" 
            tickLine={false} 
            axisLine={false} 
            tickMargin={8} 
            className="text-xs" 
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            tickLine={false} 
            axisLine={false} 
            tickMargin={8} 
            className="text-xs" 
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
          <Area 
            type="monotone" 
            dataKey="attendance" 
            stroke="hsl(142.1 76.2% 36.3%)" 
            fill="url(#fillAttendance)" 
            strokeWidth={2}
          />
          <Area 
            type="monotone" 
            dataKey="late" 
            stroke="hsl(45 93% 58%)" 
            fill="url(#fillLate)" 
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    );
  }

  // Distribution/Status Chart
  if (type === 'distribution' || type === 'status') {
    if (!data) return <div className="text-center py-8 text-muted-foreground">No data available</div>;

    // Prepare data based on input structure
    let chartData = [];
    if (Array.isArray(data)) {
      chartData = data;
    } else {
       // Assume it's the todaySummary object
       chartData = [
         { name: 'On Time', value: data.onTime, color: '#22C55E' }, // Green
         { name: 'Late', value: data.late, color: '#EAB308' },   // Yellow
         { name: 'Absent', value: data.absent, color: '#EF4444' } // Red
       ].filter(item => item.value > 0);
    }

    if (chartData.length === 0) {
       return <div className="text-center py-8 text-muted-foreground">No data available</div>;
    }

    const renderCustomChart = () => {
      switch (chartType) {
        case 'bar':
          return (
            <div className="w-full min-w-0 overflow-hidden">
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -5, bottom: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 8 }}
                    interval={0}
                    height={30}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 8 }}
                    width={20}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        default: // donut or pie
          return (
            <div className="w-full min-w-0 overflow-hidden">
              <ResponsiveContainer width="100%" height={100}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={chartType === 'donut' ? 20 : 0}
                    outerRadius={38}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          );
      }
    };

    return (
      <div className="space-y-2 sm:space-y-3 md:space-y-4 w-full min-w-0">
        <div className="animate-in fade-in-0 zoom-in-95 duration-500 w-full min-w-0">
          {renderCustomChart()}
        </div>
        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4">
          {chartData.map((item: any) => (
            <div key={item.name} className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[9px] sm:text-[10px] md:text-xs lg:text-sm">
              <div 
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full shrink-0" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground">{item.name}:</span>
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
