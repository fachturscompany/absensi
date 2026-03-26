"use client";

// src/components/organization/settings/contact-location-card.tsx

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import {
  Phone,
  Mail,
  Globe,
  Check,
  ChevronsUpDown,
  Loader2,
} from "@/components/icons/lucide-exports";
import { cn } from "@/lib/utils";
import { useState } from "react";

import type {
  OrgSettingsFormData,
  GeoState,
  GeoCity,
  CountryOption,
} from "@/types/organization/org-settings";

interface ContactLocationCardProps {
  formData: OrgSettingsFormData;
  onChange: (updates: Partial<OrgSettingsFormData>) => void;
  onCountryChange: (countryCode: string) => void;
  countryOptions: CountryOption[];
  stateOptions: GeoState[];
  cityOptions: GeoCity[];
  stateLabel: string;
  cityLabel: string;
  geoLoading?: boolean;
}

export function ContactLocationCard({
  formData,
  onChange,
  onCountryChange,
  countryOptions,
  stateOptions,
  cityOptions,
  stateLabel,
  cityLabel,
  geoLoading = false,
}: ContactLocationCardProps) {
  const [countryPopoverOpen, setCountryPopoverOpen] = useState(false);
  const [statePopoverOpen, setStatePopoverOpen] = useState(false);
  const [cityPopoverOpen, setCityPopoverOpen] = useState(false);

  // Debug & Safeguard: Deduplicate options to avoid "Encountered two children with the same key"
  const safeCountryOptions = Array.from(new Map(countryOptions.map(o => [o.value, o])).values());
  const safeStateOptions = Array.from(new Map(stateOptions.map(o => [o.value, o])).values());
  const safeCityOptions = Array.from(new Map(cityOptions.map(o => [o.value, o])).values());

  const hasCityDuplicates = cityOptions.length !== safeCityOptions.length;
  if (hasCityDuplicates) {
    console.warn("[ContactLocationCard] Found city duplicates for key uniqueness safety:",
      cityOptions.filter((item, index) => cityOptions.findIndex(c => c.value === item.value) !== index)
        .map(c => c.value)
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Phone className="h-5 w-5 text-primary" />
          Contact & Location
        </CardTitle>
        <CardDescription>Contact details and address information</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="org-email" className="text-sm font-medium flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            Email Address
          </Label>
          <Input
            id="org-email"
            type="email"
            value={formData.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="info@example.com"
            className="h-10"
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="org-phone" className="text-sm font-medium flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            Phone Number
          </Label>
          <Input
            id="org-phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="+62 xxx xxxx xxxx"
            className="h-10"
          />
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="org-website" className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            Website
          </Label>
          <Input
            id="org-website"
            type="url"
            value={formData.website}
            onChange={(e) => onChange({ website: e.target.value })}
            placeholder="https://example.com"
            className="h-10"
          />
        </div>

        <Separator />

        {/* Street Address */}
        <div className="space-y-2">
          <Label htmlFor="org-address" className="text-sm font-medium">
            Street Address
          </Label>
          <Input
            id="org-address"
            value={formData.address}
            onChange={(e) => onChange({ address: e.target.value })}
            placeholder="123 Main Street"
            className="h-10"
          />
        </div>

        {/* Country + State */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="org-country" className="text-sm font-medium">
              Country
            </Label>
            <Popover open={countryPopoverOpen} onOpenChange={setCountryPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={countryPopoverOpen}
                  className="w-full justify-between h-10"
                >
                  <span className="truncate">
                    {countryOptions.find((c) => c.value === formData.country_code)?.label ||
                      "Select country..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search country..." />
                  <CommandEmpty>No country found.</CommandEmpty>
                  <CommandGroup>
                    <CommandList>
                      {safeCountryOptions.map((country) => (
                        <CommandItem
                          key={country.value}
                          value={country.label} // Command search works on value, so we use label for searching
                          onSelect={() => {
                            onCountryChange(country.value);
                            setCountryPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.country_code === country.value
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {country.label}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">State / Province</Label>
            <Popover open={statePopoverOpen} onOpenChange={setStatePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={statePopoverOpen}
                  className="w-full justify-between h-10"
                  disabled={stateOptions.length === 0 || geoLoading}
                >
                  <span className="truncate">
                    {geoLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      stateLabel || "Select state..."
                    )}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search state..." />
                  <CommandEmpty>No state found.</CommandEmpty>
                  <CommandGroup>
                    <CommandList>
                      {safeStateOptions.map((state) => (
                        <CommandItem
                          key={state.value}
                          value={state.label}
                          onSelect={() => {
                            const val = state.value;
                            onChange({
                              state_province: val === formData.state_province ? "" : val,
                              city: "", // Reset city saat state berubah
                            });
                            setStatePopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.state_province === state.value
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {state.label}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* City + Postal Code */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">City</Label>
            <Popover open={cityPopoverOpen} onOpenChange={setCityPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={cityPopoverOpen}
                  className="w-full justify-between h-10"
                  disabled={!formData.state_province || geoLoading}
                >
                  <span className="truncate">
                    {geoLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      cityLabel || "Select city..."
                    )}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search city..." />
                  <CommandEmpty>No city found.</CommandEmpty>
                  <CommandGroup>
                    <CommandList>
                      {safeCityOptions.map((city) => (
                        <CommandItem
                          key={city.value}
                          value={city.label}
                          onSelect={() => {
                            const val = city.value;
                            onChange({ city: val === formData.city ? "" : val });
                            setCityPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.city === city.value ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {city.label}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-postal" className="text-sm font-medium">
              Postal Code
            </Label>
            <Input
              id="org-postal"
              value={formData.postal_code}
              onChange={(e) => onChange({ postal_code: e.target.value })}
              placeholder="12345"
              className="h-10"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}