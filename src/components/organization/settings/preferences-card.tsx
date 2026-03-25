"use client";

// src/components/organization/settings/PreferencesCard.tsx
// Timezone dan currency di-fetch dari API — tidak hardcoded

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Clock, Loader2, Check, ChevronsUpDown } from "@/components/icons/lucide-exports";
import { cn } from "@/lib/utils";

import { useTimezones, useCurrencies } from "@/hooks/organization/settings/use-select-option";
import type { OrgSettingsFormData } from "@/types/organization/org-settings";

interface PreferencesCardProps {
  formData: OrgSettingsFormData;
  onChange: (updates: Partial<OrgSettingsFormData>) => void;
}

export function PreferencesCard({ formData, onChange }: PreferencesCardProps) {
  const [mounted, setMounted] = useState(false);
  const [tzPopoverOpen, setTzPopoverOpen] = useState(false);
  const [curPopoverOpen, setCurPopoverOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: timezones, isLoading: loadingTz } = useTimezones();
  const { data: currencies, isLoading: loadingCur } = useCurrencies();

  const isTzLoading = loadingTz || !mounted;
  const isCurLoading = loadingCur || !mounted;

  // Group timezone berdasarkan region untuk UX lebih baik
  const timezoneGroups = timezones
    ? timezones.reduce<Record<string, typeof timezones>>((acc, tz) => {
      const region = tz.region || "Other";
      if (!acc[region]) acc[region] = [];
      acc[region].push(tz);
      return acc;
    }, {})
    : {};

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-primary" />
          Preferences
        </CardTitle>
        <CardDescription>Timezone, currency, and time format settings</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Timezone */}
        <div className="space-y-2">
          <Label htmlFor="org-timezone" className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            Timezone
          </Label>
          {isTzLoading ? (
            <div className="flex items-center gap-2 h-10 px-3 border rounded-md text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading timezones...
            </div>
          ) : (
            <Popover open={tzPopoverOpen} onOpenChange={setTzPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={tzPopoverOpen}
                  className="w-full justify-between h-10 font-normal"
                >
                  <span className="truncate">
                    {timezones?.find((tz) => tz.value === formData.timezone)?.label || "Select timezone..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search timezone..." />
                  <CommandEmpty>No timezone found.</CommandEmpty>
                  <CommandList className="max-h-72">
                    {Object.entries(timezoneGroups).map(([region, tzList]) => (
                      <CommandGroup key={region} heading={region}>
                        {tzList.map((tz) => (
                          <CommandItem
                            key={tz.value}
                            value={tz.value}
                            onSelect={() => {
                              onChange({ timezone: tz.value });
                              setTzPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.timezone === tz.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {tz.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <Label htmlFor="org-currency" className="text-sm font-medium">
            Currency
          </Label>
          {isCurLoading ? (
            <div className="flex items-center gap-2 h-10 px-3 border rounded-md text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading currencies...
            </div>
          ) : (
            <Popover open={curPopoverOpen} onOpenChange={setCurPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={curPopoverOpen}
                  className="w-full justify-between h-10 font-normal"
                >
                  <span className="truncate">
                    {currencies?.find((cur) => cur.code === formData.currency_code)?.label || "Select currency..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search currency..." />
                  <CommandEmpty>No currency found.</CommandEmpty>
                  <CommandList className="max-h-72">
                    <CommandGroup>
                      {currencies?.map((cur) => (
                        <CommandItem
                          key={cur.code}
                          value={cur.code}
                          onSelect={() => {
                            onChange({ currency_code: cur.code });
                            setCurPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.currency_code === cur.code ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {cur.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>

        <Separator />

        {/* Time Format */}
        <div className="space-y-2">
          <Label htmlFor="org-time-format" className="text-sm font-medium">
            Time Format
          </Label>
          <Select
            value={formData.time_format}
            onValueChange={(value) => onChange({ time_format: value as "12h" | "24h" })}
          >
            <SelectTrigger id="org-time-format" className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12h">12-hour (1:00 PM)</SelectItem>
              <SelectItem value="24h">24-hour (13:00)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}