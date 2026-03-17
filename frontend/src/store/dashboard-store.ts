import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DashboardState {
    visibleWidgets: Record<string, boolean>;
    toggleWidget: (key: string) => void;
    setWidgetVisibility: (key: string, isVisible: boolean) => void;
    resetWidgets: () => void;
}

// Default layout configuration
// Keys must match the identifiers used in the Dashboard page
const defaultWidgets: Record<string, boolean> = {
    // Extra Large
    'map': true,

    // Summary Stats (Top Cards)
    'summary_total_staff': true,
    'summary_present': true,
    'summary_late': true,
    'summary_permission': true,

    // Small Widgets (Stats Cards)
    'earned_week': true,
    'earned_today': true,
    'worked_week': true,
    'worked_today': true,
    'projects_worked': true,
    'activity_today': true,
    'activity_week': true,

    // Large Widgets (Panels)
    'todays_activity_table': true,
    'staff_status_chart': true,
    'permission_requests': true,
    'late_missed_shifts': true,
    'manual_time': true,
    'payments': true,
    'time_off_balances': true,
    'time_off_requested': true,
    'timesheet': true,
    'todos': true,
    'current_project_activity': true,
};

export const useDashboardStore = create<DashboardState>()(
    persist(
        (set) => ({
            visibleWidgets: defaultWidgets,
            toggleWidget: (key) =>
                set((state) => ({
                    visibleWidgets: {
                        ...state.visibleWidgets,
                        [key]: !state.visibleWidgets[key],
                    },
                })),
            setWidgetVisibility: (key, isVisible) =>
                set((state) => ({
                    visibleWidgets: {
                        ...state.visibleWidgets,
                        [key]: isVisible,
                    },
                })),
            resetWidgets: () => set({ visibleWidgets: defaultWidgets }),
        }),
        {
            name: 'dashboard-widgets-storage', // unique name for localStorage
        }
    )
);
