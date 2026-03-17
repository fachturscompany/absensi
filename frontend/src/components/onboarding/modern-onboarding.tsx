'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Building2,
  Users,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Rocket,
  Shield,
  Zap,
  ArrowRight,
  Plus,
  Globe,
  Clock,
  MapPin,
  Award,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ComponentType<any>;
}

// Step Components
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center space-y-6 py-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="relative"
      >
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-12 w-12 text-primary" />
        </div>
        <motion.div
          className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <CheckCircle2 className="h-4 w-4 text-white" />
        </motion.div>
      </motion.div>
      
      <div className="space-y-2 max-w-md">
        <h2 className="text-3xl font-bold">Welcome to AttendPro!</h2>
        <p className="text-muted-foreground">
          Let's get your organization set up in just a few minutes. We'll guide you through the essential steps to start managing attendance efficiently.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <Button size="lg" onClick={onNext} className="w-full">
          Get Started
          <Rocket className="ml-2 h-4 w-4" />
        </Button>
        <Button variant="outline" size="lg" className="w-full">
          I already have an account
        </Button>
      </div>

      <div className="flex items-center gap-8 pt-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-sm">Free 14-day trial</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <span className="text-sm">No credit card required</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-600" />
          <span className="text-sm">Setup in 5 minutes</span>
        </div>
      </div>
    </motion.div>
  );
}

function OrganizationStep() {
  const [orgType, setOrgType] = useState('company');
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="org-name">Organization Name</Label>
          <Input
            id="org-name"
            placeholder="Enter your organization name"
            className="mt-1"
          />
        </div>

        <div>
          <Label>Organization Type</Label>
          <RadioGroup value={orgType} onValueChange={setOrgType} className="mt-2">
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: 'company', label: 'Company', icon: Building2 },
                { value: 'school', label: 'School', icon: Award },
                { value: 'nonprofit', label: 'Non-Profit', icon: Globe },
                { value: 'government', label: 'Government', icon: Shield },
              ].map((type) => (
                <motion.div
                  key={type.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <label
                    htmlFor={type.value}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-lg border-2 p-4 cursor-pointer transition-all",
                      orgType === type.value
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    )}
                  >
                    <RadioGroupItem value={type.value} id={type.value} className="sr-only" />
                    <type.icon className="h-5 w-5" />
                    <span className="font-medium">{type.label}</span>
                  </label>
                </motion.div>
              ))}
            </div>
          </RadioGroup>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="employees">Number of Employees</Label>
            <Input
              id="employees"
              type="number"
              placeholder="e.g., 50"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              placeholder="e.g., Technology"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="timezone">Timezone</Label>
          <Input
            id="timezone"
            placeholder="e.g., Asia/Jakarta"
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
}

function LocationsStep() {
  const [locations, setLocations] = useState([
    { id: 1, name: '', address: '' }
  ]);

  const addLocation = () => {
    setLocations([...locations, { id: Date.now(), name: '', address: '' }]);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Add your office locations. Employees will check in from these locations.
        </p>
        
        {locations.map((location, index) => (
          <motion.div
            key={location.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-3 p-4 border rounded-lg"
          >
            <div className="flex items-center justify-between">
              <Label>Location {index + 1}</Label>
              {locations.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocations(locations.filter(l => l.id !== location.id))}
                >
                  Remove
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Location name (e.g., Main Office)"
                value={location.name}
                onChange={(e) => {
                  const updated = [...locations];
                  if (updated[index]) updated[index]!.name = e.target.value;
                  setLocations(updated);
                }}
              />
              <Input
                placeholder="Address"
                value={location.address}
                onChange={(e) => {
                  const updated = [...locations];
                  if (updated[index]) updated[index]!.address = e.target.value;
                  setLocations(updated);
                }}
              />
            </div>
          </motion.div>
        ))}

        <Button variant="outline" onClick={addLocation} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Another Location
        </Button>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-primary mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Location-based Check-in</p>
            <p className="text-xs text-muted-foreground">
              Employees can only check in when they're within the specified radius of these locations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScheduleStep() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label>Default Work Schedule</Label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <Label htmlFor="start-time" className="text-xs">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                defaultValue="09:00"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="end-time" className="text-xs">End Time</Label>
              <Input
                id="end-time"
                type="time"
                defaultValue="18:00"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div>
          <Label>Working Days</Label>
          <div className="grid grid-cols-7 gap-2 mt-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="text-center">
                <Checkbox
                  id={day}
                  defaultChecked={!['Sat', 'Sun'].includes(day)}
                  className="mb-1"
                />
                <Label
                  htmlFor={day}
                  className="text-xs cursor-pointer"
                >
                  {day}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Break Time</Label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <Input
              type="time"
              defaultValue="12:00"
              placeholder="Break start"
            />
            <Input
              type="time"
              defaultValue="13:00"
              placeholder="Break end"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="flexible" />
            <Label htmlFor="flexible">Allow flexible hours</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="remote" />
            <Label htmlFor="remote">Allow remote work</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="overtime" defaultChecked />
            <Label htmlFor="overtime">Track overtime</Label>
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamStep() {
  const [inviteEmails, setInviteEmails] = useState(['']);

  const addEmailField = () => {
    setInviteEmails([...inviteEmails, '']);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Invite your team members to get started. You can always add more people later.
        </p>

        {inviteEmails.map((email, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex gap-2"
          >
            <Input
              type="email"
              placeholder="team.member@company.com"
              value={email}
              onChange={(e) => {
                const updated = [...inviteEmails];
                updated[index] = e.target.value;
                setInviteEmails(updated);
              }}
              className="flex-1"
            />
            {inviteEmails.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setInviteEmails(inviteEmails.filter((_, i) => i !== index))}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </motion.div>
        ))}

        <Button variant="outline" onClick={addEmailField} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Another Email
        </Button>

        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Bulk Import Available</p>
              <p className="text-xs text-muted-foreground">
                You can also import employees from CSV or connect with your HR system later.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompleteStep() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center space-y-6 py-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="relative"
      >
        <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
          <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-green-600/20"
          initial={{ scale: 0.8, opacity: 1 }}
          animate={{ scale: 1.2, opacity: 0 }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </motion.div>

      <div className="space-y-2 max-w-md">
        <h2 className="text-3xl font-bold">You're All Set!</h2>
        <p className="text-muted-foreground">
          Your organization has been successfully configured. You're ready to start tracking attendance.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-md pt-4">
        <Card className="p-4 text-center">
          <Building2 className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">1</p>
          <p className="text-xs text-muted-foreground">Organization</p>
        </Card>
        <Card className="p-4 text-center">
          <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">2</p>
          <p className="text-xs text-muted-foreground">Locations</p>
        </Card>
        <Card className="p-4 text-center">
          <Users className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">5</p>
          <p className="text-xs text-muted-foreground">Team Members</p>
        </Card>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <Button size="lg" className="w-full">
          Go to Dashboard
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button variant="outline" size="lg" className="w-full">
          Take a Tour
        </Button>
      </div>
    </motion.div>
  );
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    subtitle: 'Let\'s get started',
    icon: Sparkles,
    content: WelcomeStep,
  },
  {
    id: 'organization',
    title: 'Organization Setup',
    subtitle: 'Tell us about your organization',
    icon: Building2,
    content: OrganizationStep,
  },
  {
    id: 'locations',
    title: 'Office Locations',
    subtitle: 'Where does your team work?',
    icon: MapPin,
    content: LocationsStep,
  },
  {
    id: 'schedule',
    title: 'Work Schedule',
    subtitle: 'Set your default working hours',
    icon: Clock,
    content: ScheduleStep,
  },
  {
    id: 'team',
    title: 'Invite Team',
    subtitle: 'Add your team members',
    icon: Users,
    content: TeamStep,
  },
  {
    id: 'complete',
    title: 'All Done!',
    subtitle: 'Setup complete',
    icon: CheckCircle2,
    content: CompleteStep,
  },
];

export default function ModernOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      const currentStepId = onboardingSteps[currentStep]?.id;
      if (currentStepId) {
        setCompletedSteps([...completedSteps, currentStepId]);
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;
  const StepContent = onboardingSteps[currentStep]?.content;
  const currentStepData = onboardingSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === onboardingSteps.length - 1;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        {!isFirstStep && !isLastStep && (
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                Step {currentStep} of {onboardingSteps.length - 2}
              </span>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Main Card */}
        <Card className="overflow-hidden">
          {!isFirstStep && !isLastStep && currentStepData && (
            <CardHeader>
              <div className="flex items-center gap-3">
                {React.createElement(currentStepData.icon, {
                  className: "h-8 w-8 text-primary"
                })}
                <div>
                  <CardTitle>{currentStepData.title}</CardTitle>
                  <CardDescription>
                    {currentStepData.subtitle}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          )}

          <CardContent className={cn(
            isFirstStep || isLastStep ? "p-0" : "pt-0"
          )}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {StepContent && <StepContent onNext={handleNext} />}
              </motion.div>
            </AnimatePresence>
          </CardContent>

          {!isFirstStep && !isLastStep && (
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <div className="flex gap-2">
                {currentStep < onboardingSteps.length - 2 && (
                  <Button variant="ghost" onClick={handleSkip}>
                    Skip
                  </Button>
                )}
                <Button onClick={handleNext}>
                  {currentStep === onboardingSteps.length - 2 ? 'Complete Setup' : 'Next'}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>

        {/* Step Indicators */}
        {!isFirstStep && !isLastStep && (
          <div className="flex justify-center mt-8 gap-2">
            {onboardingSteps.slice(1, -1).map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentStep - 1
                    ? "w-8 bg-primary"
                    : completedSteps.includes(step.id)
                    ? "bg-primary/60"
                    : "bg-muted"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
