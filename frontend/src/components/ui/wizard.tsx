import * as React from "react"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface WizardStep {
  number: number
  title: string
  description?: string
}

interface WizardProps {
  steps: WizardStep[]
  currentStep: number
  children: React.ReactNode
  onNext?: () => void
  onPrevious?: () => void
  canGoNext?: boolean
  canGoPrevious?: boolean
  showNavigation?: boolean
  className?: string
}

export function Wizard({
  steps,
  currentStep,
  children,
  onNext,
  onPrevious,
  canGoNext = true,
  canGoPrevious = true,
  showNavigation = true,
  className,
}: WizardProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Progress Indicator */}
      <nav aria-label="Export wizard steps">
      <div className="relative">
          <ol role="list" className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = step.number < currentStep
            const isCurrent = step.number === currentStep

            return (
              <React.Fragment key={step.number}>
                  <li className="flex flex-col items-center flex-1" role="listitem">
                  {/* Step Circle */}
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all relative z-10",
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : isCurrent
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                      aria-current={isCurrent ? "step" : undefined}
                      aria-label={`Step ${step.number}: ${step.title}${isCurrent ? " (current step)" : isCompleted ? " (completed)" : ""}`}
                  >
                    {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                    ) : (
                        <span aria-hidden="true">{step.number}</span>
                    )}
                  </div>
                  {/* Step Label */}
                  <div className="mt-2 text-center">
                      <p className="text-xs font-medium" suppressHydrationWarning>{step.title}</p>
                    {step.description && (
                        <p className="text-xs text-muted-foreground mt-0.5" suppressHydrationWarning>
                        {step.description}
                      </p>
                    )}
                  </div>
                  </li>
                {/* Connector Line */}
                {index < steps.length - 1 && (
                    <li
                    className={cn(
                      "flex-1 h-0.5 mx-2 -mt-5 relative z-0",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )}
                      role="presentation"
                      aria-hidden="true"
                  />
                )}
              </React.Fragment>
            )
          })}
          </ol>
        </div>
      </nav>

      {/* Main Content Card */}
      <div className="bg-card rounded-lg border shadow-sm p-6 min-h-[400px] flex flex-col">
        {/* Content Area */}
        <div className="flex-1 flex flex-col">{children}</div>

        {/* Footer with Navigation */}
        {showNavigation && (
          <div className="flex items-center justify-end mt-6 pt-6 border-t">
            {/* Navigation Buttons */}
            <nav aria-label="Wizard navigation">
            <div className="flex gap-2">
              {onPrevious && currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={onPrevious}
                  disabled={!canGoPrevious}
                    aria-label={`Kembali ke step ${currentStep - 1}: ${steps.find(s => s.number === currentStep - 1)?.title || ""}`}
                >
                  Back
                </Button>
              )}
              {onNext && currentStep < steps.length && (
                <Button
                  onClick={onNext}
                  disabled={!canGoNext}
                    aria-label={`Lanjut ke step ${currentStep + 1}: ${steps.find(s => s.number === currentStep + 1)?.title || ""}`}
                >
                  Next
                </Button>
              )}
            </div>
            </nav>
          </div>
        )}
      </div>
    </div>
  )
}

