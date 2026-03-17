"use client"

import { useEffect, useState } from "react"
import { useSetupWizardStore } from "@/store/setup-wizard-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

const CURRENCIES = [
  { code: "IDR", name: "Indonesian Rupiah" },
  { code: "USD", name: "US Dollar" },
  { code: "MYR", name: "Malaysian Ringgit" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "THB", name: "Thai Baht" },
  { code: "PHP", name: "Philippine Peso" },
]

const ATTENDANCE_METHODS = [
  { value: "manual", label: "Manual" },
  { value: "biometric", label: "Biometric" },
  { value: "gps", label: "GPS" },
  { value: "mobile", label: "Mobile App" },
]

const LEAVE_POLICIES = [
  { value: "standard", label: "Standard" },
  { value: "flexible", label: "Flexible" },
  { value: "unlimited", label: "Unlimited" },
]

interface BasicSettingsProps {
  onNext: () => void
  onPrev: () => void
}

export function BasicSettings({ onNext, onPrev }: BasicSettingsProps) {
  const wizardStore = useSetupWizardStore()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!wizardStore.basicSettings.currency) {
      newErrors.currency = "Currency is required"
    }
    if (!wizardStore.basicSettings.work_hours_start) {
      newErrors.work_hours_start = "Start time is required"
    }
    if (!wizardStore.basicSettings.work_hours_end) {
      newErrors.work_hours_end = "End time is required"
    }
    if (!wizardStore.basicSettings.attendance_method) {
      newErrors.attendance_method = "Attendance method is required"
    }
    if (!wizardStore.basicSettings.leave_policy) {
      newErrors.leave_policy = "Leave policy is required"
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
    wizardStore.setBasicSettings({ [field]: value } as any)
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
        <h2 className="text-2xl font-bold">Basic Settings</h2>
        <p className="text-muted-foreground">
          Configure basic settings for your organization.
        </p>
      </div>

      <div className="space-y-4">
        {/* Currency */}
        <div className="space-y-2">
          <Label htmlFor="currency">Currency *</Label>
          <Select
            value={wizardStore.basicSettings.currency}
            onValueChange={(value) => handleInputChange("currency", value)}
          >
            <SelectTrigger
              id="currency"
              className={errors.currency ? "border-red-500" : ""}
            >
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((curr) => (
                <SelectItem key={curr.code} value={curr.code}>
                  {curr.code} - {curr.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.currency && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{errors.currency}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Work Hours */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="work-start">Work Hours Start *</Label>
            <Input
              id="work-start"
              type="time"
              value={wizardStore.basicSettings.work_hours_start}
              onChange={(e) => handleInputChange("work_hours_start", e.target.value)}
              className={errors.work_hours_start ? "border-red-500" : ""}
            />
            {errors.work_hours_start && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {errors.work_hours_start}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="work-end">Work Hours End *</Label>
            <Input
              id="work-end"
              type="time"
              value={wizardStore.basicSettings.work_hours_end}
              onChange={(e) => handleInputChange("work_hours_end", e.target.value)}
              className={errors.work_hours_end ? "border-red-500" : ""}
            />
            {errors.work_hours_end && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {errors.work_hours_end}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Attendance Method */}
        <div className="space-y-2">
          <Label htmlFor="attendance-method">Attendance Method *</Label>
          <Select
            value={wizardStore.basicSettings.attendance_method}
            onValueChange={(value) => handleInputChange("attendance_method", value)}
          >
            <SelectTrigger
              id="attendance-method"
              className={errors.attendance_method ? "border-red-500" : ""}
            >
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              {ATTENDANCE_METHODS.map((method) => (
                <SelectItem key={method.value} value={method.value}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.attendance_method && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {errors.attendance_method}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Leave Policy */}
        <div className="space-y-2">
          <Label htmlFor="leave-policy">Leave Policy *</Label>
          <Select
            value={wizardStore.basicSettings.leave_policy}
            onValueChange={(value) => handleInputChange("leave_policy", value)}
          >
            <SelectTrigger
              id="leave-policy"
              className={errors.leave_policy ? "border-red-500" : ""}
            >
              <SelectValue placeholder="Select policy" />
            </SelectTrigger>
            <SelectContent>
              {LEAVE_POLICIES.map((policy) => (
                <SelectItem key={policy.value} value={policy.value}>
                  {policy.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.leave_policy && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {errors.leave_policy}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-3 pt-6">
        <Button onClick={onPrev} variant="outline">
          Previous
        </Button>
        <Button onClick={handleNext}>
          Next Step
        </Button>
      </div>
    </div>
  )
}
