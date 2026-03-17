
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"

export interface WorkHourEntry {
    id: string
    hours: number
    unit: string
}

export interface WorkTimeLimitState {
    selectedDays: DayOfWeek[];
    disableTracking: boolean;
    expectedHours: WorkHourEntry[];
    weeklyLimit: number;
    dailyLimit: number;

    setSelectedDays: (days: DayOfWeek[]) => void;
    setDisableTracking: (disable: boolean) => void;
    setExpectedHours: (hours: WorkHourEntry[]) => void;
    setWeeklyLimit: (limit: number) => void;
    setDailyLimit: (limit: number) => void;
}

export const useWorkTimeLimitStore = create<WorkTimeLimitState>()(
    persist(
        (set) => ({
            selectedDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
            disableTracking: false,
            expectedHours: [{ id: "1", hours: 40, unit: "hrs/wk" }],
            weeklyLimit: 40,
            dailyLimit: 8,

            setSelectedDays: (days) => set({ selectedDays: days }),
            setDisableTracking: (disable) => set({ disableTracking: disable }),
            setExpectedHours: (hours) => set({ expectedHours: hours }),
            setWeeklyLimit: (limit) => set({ weeklyLimit: limit }),
            setDailyLimit: (limit) => set({ dailyLimit: limit }),
        }),
        {
            name: 'work-time-limit-storage',
        }
    )
);
