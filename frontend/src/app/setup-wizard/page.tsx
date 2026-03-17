"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSetupWizardStore } from "@/store/setup-wizard-store"
import { useOrgStore } from "@/store/org-store"
import { OrgInfo } from "@/components/setup-wizard/steps/org-info"
import { BasicSettings } from "@/components/setup-wizard/steps/basic-settings"
import { ImportMembers } from "@/components/setup-wizard/steps/import-members"
import { RoleAssignment } from "@/components/setup-wizard/steps/role-assignment"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Loader2 } from "lucide-react"

const STEPS = [
  { number: 1, title: "Organization Info", description: "Basic organization details" },
  { number: 2, title: "Basic Settings", description: "Work hours and policies" },
  { number: 3, title: "Import Members", description: "Upload member data" },
  { number: 4, title: "Role Assignment", description: "Set default roles" },
]

export default function SetupWizard() {
  const router = useRouter()
  const wizardStore = useSetupWizardStore()
  const orgStore = useOrgStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const handleNextStep = () => {
    if (wizardStore.currentStep < STEPS.length) {
      wizardStore.setCurrentStep(wizardStore.currentStep + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handlePrevStep = () => {
    if (wizardStore.currentStep > 1) {
      wizardStore.setCurrentStep(wizardStore.currentStep - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleCompleteSetup = async () => {
    try {
      setIsSubmitting(true)
      setError(null)

      // Validate all required data
      if (!wizardStore.orgInfo.name || !wizardStore.orgInfo.code) {
        setError("Organization information is incomplete")
        return
      }

      if (!wizardStore.roleAssignment.default_role_id) {
        setError("Default role is not selected")
        return
      }

      // TODO: Create organization in database
      // For now, just simulate the process
      console.log("Setup data:", {
        orgInfo: wizardStore.orgInfo,
        basicSettings: wizardStore.basicSettings,
        importMembers: wizardStore.importMembers,
        roleAssignment: wizardStore.roleAssignment,
      })

      // Set organization in stores
      orgStore.setOrganizationId(1, wizardStore.orgInfo.name) // ID will come from API
      orgStore.setTimezone(wizardStore.orgInfo.timezone)

      // Reset wizard
      wizardStore.reset()

      // Redirect to dashboard
      router.push("/")
    } catch (err) {
      console.error("Error completing setup:", err)
      setError(err instanceof Error ? err.message : "Failed to complete setup")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Setup Your Organization</h1>
        <p className="text-muted-foreground">
          Complete these steps to set up your organization. This should take about 5 minutes.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        {STEPS.map((step) => (
          <div key={step.number} className="space-y-2">
            <div
              className={`flex items-center justify-center h-10 rounded-full font-semibold transition-all ${step.number < wizardStore.currentStep
                  ? "bg-green-600 text-white"
                  : step.number === wizardStore.currentStep
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground"
                }`}
            >
              {step.number < wizardStore.currentStep ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                step.number
              )}
            </div>
            <div className="text-center">
              <p className="text-xs font-medium hidden md:block">{step.title}</p>
              <p className="text-xs text-muted-foreground hidden md:block">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Content Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            Step {wizardStore.currentStep}: {STEPS[wizardStore.currentStep - 1]?.title}
          </CardTitle>
          <CardDescription>{STEPS[wizardStore.currentStep - 1]?.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Organization Info */}
          {wizardStore.currentStep === 1 && <OrgInfo onNext={handleNextStep} />}

          {/* Step 2: Basic Settings */}
          {wizardStore.currentStep === 2 && (
            <BasicSettings onNext={handleNextStep} onPrev={handlePrevStep} />
          )}

          {/* Step 3: Import Members */}
          {wizardStore.currentStep === 3 && (
            <ImportMembers onNext={handleNextStep} onPrev={handlePrevStep} />
          )}

          {/* Step 4: Role Assignment */}
          {wizardStore.currentStep === 4 && (
            <RoleAssignment
              onNext={handleNextStep}
              onPrev={handlePrevStep}
              onComplete={handleCompleteSetup}
            />
          )}
        </CardContent>
      </Card>

      {/* Submitting State */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <p className="text-center font-medium">Setting up your organization...</p>
              <p className="text-center text-sm text-muted-foreground">
                This may take a moment. Please don't close this window.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

