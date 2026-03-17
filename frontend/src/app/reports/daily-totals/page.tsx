"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    TooltipProps
} from "recharts"
import { format, eachDayOfInterval, startOfWeek, endOfWeek } from "date-fns"

import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { SelectedFilter, DateRange } from "@/components/insights/types"

import { DUMMY_MEMBERS, DUMMY_TEAMS, DUMMY_REPORT_ACTIVITIES } from "@/lib/data/dummy-data"
import { BarChart2 } from "lucide-react"

// Filter Data derived from global dummy data
const MEMBERS_PICKER = DUMMY_MEMBERS.map(m => ({ id: m.id, name: m.name, type: "member" as const }))
const TEAMS_PICKER = DUMMY_TEAMS.map(t => ({ id: t.id, name: t.name, type: "team" as const }))

// COLORS from homepage
const COLORS = {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#06B6D4',
    purple: '#8B5CF6',
};

// Custom Tooltip from homepage (adapted)
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                <p className="font-semibold text-sm mb-2 text-gray-700">{label}</p>
                <div className="space-y-1">
                    {payload?.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-4 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-gray-500">{entry.name}:</span>
                            </div>
                            <span className="font-bold text-gray-900">{entry.value}h</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};


// Helper to parser time "H:MM:SS" to seconds
const parseTimeToSeconds = (timeStr: string) => {
    if (!timeStr || timeStr === "-") return 0;
    const parts = timeStr.split(':');
    if (parts.length < 3) return 0;
    const h = parseInt(parts[0] || '0', 10);
    const m = parseInt(parts[1] || '0', 10);
    const s = parseInt(parts[2] || '0', 10);
    return h * 3600 + m * 60 + s;
};

// Helper to format seconds to "H:MM:SS"
const formatSecondsToTime = (totalSeconds: number) => {
    if (!totalSeconds || totalSeconds === 0) return "-";
    const seconds = Math.round(totalSeconds);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function DailyTotalsPage() {
    const [showChart, setShowChart] = useState(true)
    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({
        type: "members",
        all: true
    })

    // Initialize with current week
    const [dateRange, setDateRange] = useState<DateRange>(() => {
        // Default to start/end of current week to match "Weekly" title.
        return {
            startDate: startOfWeek(new Date(), { weekStartsOn: 1 }),
            endDate: endOfWeek(new Date(), { weekStartsOn: 1 })
        };
    })

    // Dynamic Date Inteval
    const dateArray = useMemo(() => {
        if (!dateRange.startDate || !dateRange.endDate) return [];
        return eachDayOfInterval({ start: dateRange.startDate, end: dateRange.endDate });
    }, [dateRange]);

    // Dynamic Data Generation
    const { tableRows, dailyTotalsStr, totalWorkedStr, totalBreakStr, avgHoursStr, avgActivity, totalAmountStr, chartData } = useMemo(() => {
        // Filter Logic

        let filteredMembers = DUMMY_MEMBERS;
        if (!selectedFilter.all && selectedFilter.id) {
            if (selectedFilter.type === "members") {
                filteredMembers = DUMMY_MEMBERS.filter(m => m.id === selectedFilter.id);
            } else if (selectedFilter.type === "teams") {
                const team = DUMMY_TEAMS.find(t => t.id === selectedFilter.id);
                if (team) {
                    filteredMembers = DUMMY_MEMBERS.filter(m => team.members.includes(m.id));
                }
            }
        }


        const toTime = (secs: number) => {
            const h = Math.floor(secs / 3600);
            const m = Math.floor((secs % 3600) / 60);
            return `0:${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        };

        const rows = filteredMembers.map((member, _mIndex) => {

            const memberActivities = DUMMY_REPORT_ACTIVITIES.filter(a => a.memberId === member.id);

            const periodActivitiesForStats = memberActivities.filter(a => {
                const aDate = new Date(a.date);
                aDate.setHours(0, 0, 0, 0);
                return aDate >= dateRange.startDate && aDate <= dateRange.endDate;
            });
            const activitySum = periodActivitiesForStats.reduce((sum, a) => sum + a.activityPercent, 0);
            const avgActivity = periodActivitiesForStats.length > 0 ? Math.round(activitySum / periodActivitiesForStats.length) : 0;

            const daysRaw = dateArray.map((date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const dayActivities = memberActivities.filter(a => a.date === dateStr);
                const dayHours = dayActivities.reduce((sum, a) => sum + a.totalHours, 0);
                return Math.floor(dayHours * 3600);
            });

            const days = daysRaw.map(s => s > 0 ? toTime(s) : "-");

            const visibleTotalSeconds = daysRaw.reduce((a, b) => a + b, 0);

            let regularSum = 0;
            let overtimeSum = 0;
            daysRaw.forEach(s => {
                const reg = Math.min(s, 8 * 3600);
                const ot = Math.max(0, s - 8 * 3600);
                regularSum += reg;
                overtimeSum += ot;
            });

            const periodActivities = memberActivities.filter(a => {
                const d = new Date(a.date);
                d.setHours(0, 0, 0, 0);
                return d >= dateRange.startDate && d <= dateRange.endDate;
            });
            const periodSpent = periodActivities.reduce((sum, a) => sum + a.totalSpent, 0);

            return {
                id: member.id,
                member: member.name,
                days,
                daysRaw,
                timeOff: "-",
                totalWorked: formatSecondsToTime(visibleTotalSeconds),
                regular: formatSecondsToTime(regularSum),
                overtime: formatSecondsToTime(overtimeSum),
                breakTime: "-",
                activity: `${avgActivity}%`,
                // Use IDR formatting
                amount: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(periodSpent),
                rawBreakSeconds: 0,
                rawAmount: periodSpent
            };
        });

        // Totals
        const membersWorkedCount = rows.length || 1;
        const totalActivityValue = rows.reduce((acc, row) => acc + parseInt(row.activity), 0);
        const avgActivityValue = Math.round(totalActivityValue / membersWorkedCount);

        const totalSecondsValue = rows.reduce((acc, row) => acc + parseTimeToSeconds(row.totalWorked), 0);
        const avgSecondsValue = totalSecondsValue / membersWorkedCount;

        const totalBreakSecondsValue = rows.reduce((acc, row) => acc + row.rawBreakSeconds, 0);
        const totalAmountValue = rows.reduce((acc, row) => acc + row.rawAmount, 0);

        // Daily Totals
        const dailyTotalSecondsArr = new Array(dateArray.length).fill(0);
        rows.forEach(row => {
            row.daysRaw.forEach((s, i) => {
                dailyTotalSecondsArr[i] += s;
            });
        });

        // Chart Data
        const chartDataPoints = dateArray.map((date, i) => {
            const dataPoint: any = { name: format(date, "EEE") };
            rows.forEach(row => {
                const hours = Math.round(((row.daysRaw[i] || 0) / 3600) * 100) / 100;
                dataPoint[row.member] = hours;
            });
            return dataPoint;
        });

        const totalAmountStr = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalAmountValue);

        return {
            tableRows: rows,
            dailyTotalsStr: dailyTotalSecondsArr.map(formatSecondsToTime),
            totalWorkedStr: formatSecondsToTime(totalSecondsValue),
            totalBreakStr: formatSecondsToTime(totalBreakSecondsValue),
            avgHoursStr: formatSecondsToTime(avgSecondsValue),
            avgActivity: avgActivityValue,
            totalAmountStr,
            chartData: chartDataPoints
        };

    }, [dateArray, selectedFilter]); // Dependencies: updates when filter or date changes

    // Update derived metrics
    const membersWorked = tableRows.length;

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950">
            {/* Top Toolbar */}
            <div className="flex flex-col gap-4 p-6 pb-2">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold mb-5">Daily totals report (Weekly)</h1>
                </div>

                <div className="w-full">
                    <InsightsHeader
                        selectedFilter={selectedFilter}
                        onSelectedFilterChange={setSelectedFilter}
                        dateRange={dateRange}
                        onDateRangeChange={setDateRange}
                        members={MEMBERS_PICKER}
                        teams={TEAMS_PICKER}
                    >
                        <Button
                            variant={showChart ? "default" : "outline"}
                            size="icon"
                            className="h-9 w-9 rounded-sm transition-colors mr-2"
                            onClick={() => setShowChart(!showChart)}
                            title={showChart ? "Hide Chart" : "Show Chart"}
                        >
                            <BarChart2 className="h-4 w-4" />
                        </Button>
                    </InsightsHeader>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-2">
                    <div className="p-3 border-l-4 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950">
                        <div className="text-[10px] font-bold text-gray-400 uppercase">MEMBERS WORKED</div>
                        <div className="text-2xl font-normal text-gray-500">{membersWorked}</div>
                    </div>
                    <div className="p-3 border-l-4 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950">
                        <div className="text-[10px] font-bold text-gray-400 uppercase">BREAK TIME</div>
                        <div className="text-2xl font-normal text-gray-500">{totalBreakStr}</div>
                    </div>
                    <div className="p-3 border-l-4 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950">
                        <div className="text-[10px] font-bold text-gray-400 uppercase">AVG. HOURS PER MEMBER</div>
                        <div className="text-2xl font-normal text-gray-500">{avgHoursStr}</div>
                    </div>
                    <div className="p-3 border-l-4 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950">
                        <div className="text-[10px] font-bold text-gray-400 uppercase">AVG. ACTIVITY</div>
                        <div className="text-2xl font-normal text-gray-500">{avgActivity}%</div>
                    </div>
                    <div className="p-3 border-l-4 border-gray-200 bg-white flex justify-between items-start">
                        <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase">SPENT</div>
                            <div className="text-2xl font-normal text-gray-500">{totalAmountStr}</div>
                        </div>

                    </div>
                </div>

                {/* Chart Section */}
                {showChart && (
                    <div className="h-[250px] w-full mt-4 relative animate-in fade-in zoom-in-95 duration-300">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <defs>
                                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                                    </linearGradient>
                                    {tableRows.map((row, index) => {
                                        const color = Object.values(COLORS)[index % Object.values(COLORS).length];
                                        return (
                                            <linearGradient key={row.id} id={`color-${row.id}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                                            </linearGradient>
                                        )
                                    })}
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9CA3AF', fontSize: 10 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9CA3AF', fontSize: 10 }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                {tableRows.map((row, index) => {
                                    const color = Object.values(COLORS)[index % Object.values(COLORS).length];
                                    return (
                                        <Area
                                            key={row.id}
                                            type="monotone"
                                            dataKey={row.member}
                                            stroke={color}
                                            fillOpacity={1}
                                            fill={`url(#color-${row.id})`}
                                            strokeWidth={2}
                                            activeDot={{ r: 4 }}
                                        />
                                    )
                                })}
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            <Separator />

            {/* Table Section */}
            <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                    <style jsx global>{`
                        html body .custom-hover-row:hover,
                        html body .custom-hover-row:hover > td {
                            background-color: #d1d5db !important; /* dark gray hover */
                        }
                        html body.dark .custom-hover-row:hover,
                        html body.dark .custom-hover-row:hover > td {
                            background-color: #374151 !important;
                        }
                    `}</style>
                    <div className="flex flex-col gap-2">
                        <h2 className="text-xl text-gray-700">Lave's Organization2</h2>
                        <span className="text-sm text-gray-400">Asia - Bangkok</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left font-medium text-gray-600 pb-4 px-4 min-w-[200px]">Member</th>
                                {dateArray.map((date, i) => (
                                    <th key={i} className="text-right font-medium text-gray-600 pb-4 px-4 min-w-[100px]">
                                        {format(date, "EEE, MMM d, yyyy")}
                                    </th>
                                ))}
                                <th className="text-right font-medium text-gray-600 pb-4 px-4 min-w-[100px]">Time Off</th>
                                <th className="text-right font-medium text-gray-600 pb-4 px-4 min-w-[100px]">Total worked</th>
                                <th className="text-right font-medium text-gray-600 pb-4 px-4 min-w-[100px]">Regular</th>
                                <th className="text-right font-medium text-gray-600 pb-4 px-4 min-w-[100px]">Overtime</th>
                                <th className="text-right font-medium text-gray-600 pb-4 px-4 min-w-[100px]">Break</th>
                                <th className="text-right font-medium text-gray-600 pb-4 px-4 min-w-[100px]">Activity</th>
                                <th className="text-right font-medium text-gray-600 pb-4 px-4 min-w-[100px]">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {tableRows.map((row, idx) => (
                                <tr
                                    key={row.id}
                                    style={{ backgroundColor: idx % 2 === 1 ? '#f1f5f9' : '#ffffff' }}
                                    className="group transition-colors custom-hover-row"
                                >
                                    <td className="py-4 px-4 text-gray-700">{row.member}</td>
                                    {row.days.map((day, i) => (
                                        <td key={i} className="py-4 px-4 text-right text-gray-500">{day}</td>
                                    ))}
                                    <td className="py-4 px-4 text-right text-gray-500">{row.timeOff}</td>
                                    <td className="py-4 px-4 text-right text-gray-800 font-medium">{row.totalWorked}</td>
                                    <td className="py-4 px-4 text-right text-gray-500">{row.regular}</td>
                                    <td className="py-4 px-4 text-right text-gray-500">{row.overtime}</td>
                                    <td className="py-4 px-4 text-right text-gray-500">{row.breakTime}</td>
                                    <td className="py-4 px-4 text-right text-gray-500">{row.activity}</td>
                                    <td className="py-4 px-4 text-right text-gray-500">{row.amount}</td>
                                </tr>
                            ))}
                            {/* Summary Row */}
                            <tr className="border-t border-gray-100 font-bold bg-gray-50">
                                <td className="py-4 px-4 text-gray-900">Total</td>
                                {dailyTotalsStr.map((total, i) => (
                                    <td key={i} className="py-4 px-4 text-right text-gray-900">{total}</td>
                                ))}
                                <td className="py-4 px-4 text-right text-gray-500">-</td>
                                <td className="py-4 px-4 text-right text-gray-900">{totalWorkedStr}</td>
                                <td className="py-4 px-4 text-right text-gray-500">-</td>
                                <td className="py-4 px-4 text-right text-gray-500">-</td>
                                <td className="py-4 px-4 text-right text-gray-900">{totalBreakStr}</td>
                                <td className="py-4 px-4 text-right text-gray-900">{avgActivity}%</td>
                                <td className="py-4 px-4 text-right text-gray-900">{totalAmountStr}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
