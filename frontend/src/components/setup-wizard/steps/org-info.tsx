"use client"

import { useEffect, useState } from "react"
import { useSetupWizardStore } from "@/store/setup-wizard-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

// Country list
const COUNTRIES = [
  { code: "ID", name: "Indonesia" },
  { code: "MY", name: "Malaysia" },
  { code: "SG", name: "Singapore" },
  { code: "TH", name: "Thailand" },
  { code: "PH", name: "Philippines" },
]

// Timezone list
const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "Asia/Jakarta", label: "Asia/Jakarta (WIB)" },
  { value: "Asia/Bangkok", label: "Asia/Bangkok" },
  { value: "Asia/Singapore", label: "Asia/Singapore" },
  { value: "Asia/Manila", label: "Asia/Manila" },
  { value: "Asia/Kuala_Lumpur", label: "Asia/Kuala_Lumpur" },
]

interface OrgInfoProps {
  onNext: () => void
}

export function OrgInfo({ onNext }: OrgInfoProps) {
  const wizardStore = useSetupWizardStore()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!wizardStore.orgInfo.name.trim()) {
      newErrors.name = "Organization name is required"
    }
    if (!wizardStore.orgInfo.code.trim()) {
      newErrors.code = "Organization code is required"
    }
    if (!/^[A-Z0-9]+$/.test(wizardStore.orgInfo.code)) {
      newErrors.code = "Code must be uppercase alphanumeric only"
    }
    if (!wizardStore.orgInfo.country_code) {
      newErrors.country_code = "Country is required"
    }
    if (!wizardStore.orgInfo.timezone) {
      newErrors.timezone = "Timezone is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateForm()) {
      onNext()
    }
  }

  const handleInputChange = (field: string, value: string) => {
    wizardStore.setOrgInfo({ [field]: value } as any)
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  if (!isHydrated) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Organization Information</h2>
        <p className="text-muted-foreground">
          Enter your organization details. This information will be used to set up your workspace.
        </p>
      </div>

      <div className="space-y-4">
        {/* Organization Name */}
        <div className="space-y-2">
          <Label htmlFor="org-name">Organization Name *</Label>
          <Input
            id="org-name"
            placeholder="e.g., PT ABC Indonesia"
            value={wizardStore.orgInfo.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{errors.name}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Organization Code */}
        <div className="space-y-2">
          <Label htmlFor="org-code">Organization Code *</Label>
          <Input
            id="org-code"
            placeholder="e.g., ABC (uppercase, no spaces)"
            value={wizardStore.orgInfo.code}
            onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())}
            maxLength={10}
            className={errors.code ? "border-red-500" : ""}
          />
          {errors.code && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{errors.code}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="country">Country *</Label>
          <Select
            value={wizardStore.orgInfo.country_code}
            onValueChange={(value) => handleInputChange("country_code", value)}
          >
            <SelectTrigger
              id="country"
              className={errors.country_code ? "border-red-500" : ""}
            >
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.country_code && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{errors.country_code}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Timezone */}
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone *</Label>
          <Select
            value={wizardStore.orgInfo.timezone}
            onValueChange={(value) => handleInputChange("timezone", value)}
          >
            <SelectTrigger
              id="timezone"
              className={errors.timezone ? "border-red-500" : ""}
            >
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.timezone && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{errors.timezone}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address">Address (Optional)</Label>
          <Textarea
            id="address"
            placeholder="e.g., Jl. Sudirman No. 1, Jakarta"
            value={wizardStore.orgInfo.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            rows={3}
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-end gap-3 pt-6">
        <Button onClick={handleNext} className="gap-2">
          Next Step
        </Button>
      </div>
    </div>
  )
}
