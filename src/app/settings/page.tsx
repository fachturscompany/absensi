'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Building2,
  Users,
  Calendar,
  Activity,
  Lightbulb,
  FileText,
  Search,
} from 'lucide-react';

interface SettingsCardProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: {
    label: string;
    href?: string;
  }[];
  badge?: string;
  searchQuery?: string;
}

function SettingsCard({ title, icon: Icon, items, badge, searchQuery = '' }: SettingsCardProps) {
  const query = searchQuery.toLowerCase();
  const titleMatch = title.toLowerCase().includes(query);

  const renderedItems = items.map((item) => {
    const itemMatch = item.label.toLowerCase().includes(query);
    const isVisible = !query || titleMatch || itemMatch;
    return { ...item, isVisible };
  });

  // Sort: Visible items first
  renderedItems.sort((a, b) => {
    if (a.isVisible === b.isVisible) return 0;
    return a.isVisible ? -1 : 1;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <Icon className="h-5 w-5 text-slate-700" />
        <h3 className="text-lg font-normal text-slate-900">{title}</h3>
        {badge && (
          <span className="ml-auto px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <ul className="space-y-2">
        {renderedItems.map((item, index) => (
          <li key={index} className={item.isVisible ? '' : 'invisible'}>
            {item.href ? (
              <Link
                href={item.href}
                className="text-sm text-slate-600 hover:text-slate-800 hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-sm text-slate-600 cursor-pointer hover:text-slate-800 hover:underline">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SettingsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const settingsCards: SettingsCardProps[] = [
    {
      title: 'Project',
      icon: Building2,
      items: [
        { label: 'Projects & taks', href: '/settings/project&task' },
      ],
    },
    {
      title: 'Members',
      icon: Users,
      items: [
        { label: 'E-mail notifications', href: '/settings/members/email-notifications' },
        { label: 'Work time limits', href: '/settings/work-time-limit' },
        { label: 'Payments', href: '/settings/payments' },
        { label: 'Achievements', href: '/settings/Achievements' },
      ],
    },
    {
      title: 'Schedules',
      icon: Calendar,
      items: [
        { label: 'Calendar', href: '/settings/Calender' },
        { label: 'Job sites', href: '/settings/Job-sites' },
        { label: 'Map', href: '/settings/Map' },
      ],
    },
    {
      title: 'Activity & tracking',
      icon: Activity,
      items: [
        { label: 'Activity', href: '/settings/Activity/track-apps-urls' },
        { label: 'Timesheets', href: '/settings/timesheets' },
        { label: 'Time & tracking', href: '/settings/tracking/allowed-apps' },
        { label: 'Screenshots', href: '/settings/screenshot' },
      ],
    },
    {
      title: 'Insights',
      icon: Lightbulb,
      badge: 'Add-on',
      items: [
        { label: 'Apps/URLs classifications', href: '/settings/app-url' },
      ],
    },
    {
      title: 'Policies',
      icon: FileText,
      items: [
        { label: 'Time off', href: '/settings/Policies' },
        { label: 'Breaks', href: '/settings/Policies/work-breaks' },
        { label: 'Overtime', href: '/settings/Policies/overtime' },
      ],
    },
  ];

  //       - If strict item filtering is applied even when title matches, then searching 'Activity & tracking' might show nothing if no item matches that exact string?
  //       - Let's go with: 
  //         1. Filter items: item.label includes query.
  //         2. Card match: Title includes query OR filteredItems.length > 0.
  //         3. Item display: If Title includes query, do specific items need to be filtered?
  //            - If I search "Activity & tracking" (Title), I probably want to see the whole card content.
  //            - If I search "Screenshots" (Item), I only want that item.
  //
  //       - Implemented detailed logic:
  //  const filteredCards = settingsCards
  //   .map(card => {
  //     const query = searchQuery.toLowerCase();
  //     const titleMatch = card.title.toLowerCase().includes(query);
  //     const filteredItems = card.items.filter(item => item.label.toLowerCase().includes(query));
  //
  //     // If title matches, show all items (user sees the category).
  //     if (titleMatch) {
  //       return card;
  //     }
  //
  //     // If title doesn't match, matches items only?
  //     if (filteredItems.length > 0) {
  //       return { ...card, items: filteredItems };
  //     }
  //
  //     return null;
  //   })
  //   .filter((card): card is SettingsCardProps => card !== null);

  const filteredCards = settingsCards.filter(card => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;

    // Check if card should be shown at all
    const titleMatch = card.title.toLowerCase().includes(query);
    const itemMatch = card.items.some(item => item.label.toLowerCase().includes(query));

    return titleMatch || itemMatch;
  });

  return (
    <div className="flex flex-1 flex-col bg-white min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-xl font-normal text-slate-900">Settings</h1>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search settings"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {filteredCards.map((card, index) => (
            <SettingsCard key={index} {...card} searchQuery={searchQuery} />
          ))}
          {filteredCards.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              No settings found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
