"use client"

import { useEffect, useState } from "react"
import { useSetupWizardStore } from "@/store/setup-wizard-store"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const DEFAULT_ROLES = [
  { id: 1, code: "A001", name: "Admin", description: "Organization Administrator" },
  { id: 2, code: "SUP", name: "Support", description: "Support Staff" },
  { id: 3, code: "MGR", name: "Manager", description: "Department Manager" },
  { id: 4, code: "STF", name: "Staff", description: "Staff Member" },
  { id: 5, code: "M001", name: "Member", description: "Regular Member" },
]

interface RoleAssignmentProps {
  onNext: () => void
  onPrev: () => void
  onComplete: () => void
}

export function RoleAssignment({ onPrev, onComplete }: RoleAssignmentProps) {
  const wizardStore = useSetupWizardStore()
  const [isHydrated, setIsHydrated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const validateForm = () => {
    if (!wizardStore.roleAssignment.default_role_id) {
      setError("Please select a default role")
      return false
    }
    return true
  }

  const handleSelectDefaultRole = (roleId: number) => {
    wizardStore.setRoleAssignment({ default_role_id: roleId })
    setError(null)
  }

  const handleComplete = () => {
    if (validateForm()) {
      onComplete()
    }
  }

  if (!isHydrated) {
    return <div>Loading...</div>
  }

  const selectedRole = DEFAULT_ROLES.find(
    (r) => r.id === wizardStore.roleAssignment.default_role_id
  )

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Role Assignment</h2>
        <p className="text-muted-foreground">
          Select a default role for imported members. Members can have their roles changed later.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Role Selection */}
      <div className="space-y-3">
        <Label>Select Default Role *</Label>
        <div className="grid gap-3 md:grid-cols-2">
          {DEFAULT_ROLES.map((role) => (
            <Card
              key={role.id}
              className={`cursor-pointer transition-all ${
                selectedRole?.id === role.id
                  ? "border-primary bg-primary/5 shadow-md"
                  : "hover:shadow-md hover:border-primary/50"
              }`}
              onClick={() => handleSelectDefaultRole(role.id)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{role.name}</CardTitle>
                <CardDescription className="text-xs">{role.code}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{role.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Summary */}
      {selectedRole && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium">Default role: {selectedRole.name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              All imported members will be assigned this role by default.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Setup Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Setup Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Organization:</span>
            <span className="font-medium">{wizardStore.orgInfo.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Code:</span>
            <span className="font-medium">{wizardStore.orgInfo.code}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Country:</span>
            <span className="font-medium">{wizardStore.orgInfo.country_code}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Timezone:</span>
            <span className="font-medium">{wizardStore.orgInfo.timezone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Work Hours:</span>
            <span className="font-medium">
              {wizardStore.basicSettings.work_hours_start} -{" "}
              {wizardStore.basicSettings.work_hours_end}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Members File:</span>
            <span className="font-medium">
              {wizardStore.importMembers.file ? wizardStore.importMembers.file.name : "None"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Default Role:</span>
            <span className="font-medium">{selectedRole?.name || "Not selected"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-3 pt-6">
        <Button onClick={onPrev} variant="outline">
          Previous
        </Button>
        <Button onClick={handleComplete} className="gap-2">
          Complete Setup
        </Button>
      </div>
    </div>
  )
}
