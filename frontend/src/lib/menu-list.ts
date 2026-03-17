import {
  Settings,
  LayoutGrid,
  UserCheck,
  Group,
  Calendar,
  ClipboardCheck,
  Briefcase,
  TrendingUp,
  CalendarCheck2,
  MapPin,
  CalendarDays,
} from "@/components/icons/lucide-exports";
import type { LucideIcon } from "@/components/icons/lucide-exports";

type Submenu = {
  href: string;
  label: string;
  active?: boolean;
};

type Menu = {
  href: string;
  label: string;
  active?: boolean;
  icon: LucideIcon;
  submenus?: Submenu[];
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

export function getMenuList(pathname: string): Group[] {
  return [
    // ========================================
    // OVERVIEW
    // ========================================
    {
      groupLabel: "Overview",
      menus: [
        {
          href: "/",
          label: "Dashboard",
          icon: LayoutGrid,
          active: pathname === "/"
        },
        {
          href: "/analytics",
          label: "Analytics",
          icon: TrendingUp,
          active: pathname.includes("/analytics")
        }
      ]
    },

    // ========================================
    // PEOPLE
    // ========================================
    {
      groupLabel: "People",
      menus: [
        {
          href: "/members",
          label: "Members",
          icon: UserCheck,
          active: pathname.includes("/members")
        },
        {
          href: "/group",
          label: "Groups",
          icon: Group,
          active: pathname.includes("/group")
        },
        {
          href: "/position",
          label: "Positions",
          icon: Briefcase,
          active: pathname.includes("/position")
        }
      ]
    },

    // ========================================
    // ATTENDANCE
    // ========================================
    {
      groupLabel: "Attendance",
      menus: [
        {
          href: "/attendance",
          label: "Records",
          icon: ClipboardCheck,
          active: pathname === "/attendance"
        },
        {
          href: "/attendance/locations",
          label: "Locations",
          icon: MapPin,
          active: pathname.includes("/attendance/locations")
        }
      ]
    },

    // ========================================
    // SCHEDULING
    // ========================================
    {
      groupLabel: "Scheduling",
      menus: [
        {
          href: "/schedule",
          label: "Work Schedules",
          icon: Calendar,
          active: pathname.includes("/schedule")
        },
        {
          href: "/member-schedules",
          label: "Member Schedules",
          icon: CalendarCheck2,
          active: pathname.includes("/member-schedules")
        }
      ]
    },

    // ========================================
    // LEAVE MANAGEMENT
    // ========================================
    {
      groupLabel: "Leave Management",
      menus: [
        {
          href: "/leaves",
          label: "My Leaves",
          icon: CalendarDays,
          active: pathname.includes("/leaves")
        }
      ]
    },

    // ========================================
    // SETTINGS
    // ========================================
    {
      groupLabel: "Settings",
      menus: [
        {
          href: "/organization/settings",
          label: "Organization",
          icon: Settings,
          active: pathname.includes("/organization/settings")
        }
      ]
    }
  ];
}
