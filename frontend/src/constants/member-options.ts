// Static options untuk member forms
// Tidak perlu fetch dari database, menghemat request

export const EMPLOYMENT_STATUS_OPTIONS = [
  { value: "full-time", label: "Full Time" },
  { value: "part-time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
  { value: "probation", label: "Probation" },
] as const

export const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const

export const CARD_TYPE_OPTIONS = [
  { value: "mifare", label: "Mifare" },
  { value: "em", label: "EM" },
  { value: "hid", label: "HID" },
  { value: "other", label: "Other" },
] as const

export const RELATIONSHIP_OPTIONS = [
  { value: "spouse", label: "Spouse" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "child", label: "Child" },
  { value: "friend", label: "Friend" },
  { value: "other", label: "Other" },
] as const

export const MARITAL_STATUS_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
] as const

export const BLOOD_TYPE_OPTIONS = [
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" },
] as const

// Helper functions
export const getEmploymentStatusLabel = (value: string | null | undefined): string => {
  if (!value) return "Not specified"
  const option = EMPLOYMENT_STATUS_OPTIONS.find(opt => opt.value === value)
  return option ? option.label : value
}

export const getGenderLabel = (value: string | null | undefined): string => {
  if (!value) return "Not specified"
  const option = GENDER_OPTIONS.find(opt => opt.value === value)
  return option ? option.label : value
}

export const getCardTypeLabel = (value: string | null | undefined): string => {
  if (!value) return "Not specified"
  const option = CARD_TYPE_OPTIONS.find(opt => opt.value === value)
  return option ? option.label : value
}
