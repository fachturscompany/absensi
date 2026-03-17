// Industry constants for organization data
// Used in both onboarding and organization settings to ensure consistency

export interface IndustryOption {
  value: string;
  label: string;
}

export const INDUSTRY_OPTIONS: IndustryOption[] = [
  { value: "technology", label: "Technology & IT" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "healthcare", label: "Healthcare & Medical" },
  { value: "education", label: "Education" },
  { value: "finance", label: "Finance & Banking" },
  { value: "retail", label: "Retail & E-commerce" },
  { value: "food-beverage", label: "Food & Beverage" },
  { value: "construction", label: "Construction & Real Estate" },
  { value: "transportation", label: "Transportation & Logistics" },
  { value: "media", label: "Media & Entertainment" },
  { value: "automotive", label: "Automotive" },
  { value: "agriculture", label: "Agriculture" },
  { value: "energy", label: "Energy & Utilities" },
  { value: "consulting", label: "Consulting & Professional Services" },
  { value: "tourism", label: "Tourism & Hospitality" },
  { value: "government", label: "Government & Public Sector" },
  { value: "non-profit", label: "Non-Profit Organization" },
  { value: "other", label: "Other" }
];

// Helper function to get industry label by value
export const getIndustryLabel = (value: string | null): string => {
  if (!value) return "Not specified";

  // Handle multiple values
  if (value.includes(",")) {
    return value
      .split(",")
      .map(v => getIndustryLabel(v.trim()))
      .join(", ");
  }

  const industry = INDUSTRY_OPTIONS.find(option => option.value.toLowerCase() === value.toLowerCase());
  return industry ? industry.label : value;
};

// Helper function to find industry value by partial match (useful for migration)
export const findIndustryValue = (searchValue: string | null): string => {
  if (!searchValue) return "";

  const lowerSearch = searchValue.toLowerCase();

  // First try exact match
  const exactMatch = INDUSTRY_OPTIONS.find(option =>
    option.value.toLowerCase() === lowerSearch
  );
  if (exactMatch) return exactMatch.value;

  // Then try partial match on label
  const labelMatch = INDUSTRY_OPTIONS.find(option =>
    option.label.toLowerCase().includes(lowerSearch) ||
    lowerSearch.includes(option.value.toLowerCase())
  );
  if (labelMatch) return labelMatch.value;

  // For legacy data, try to map common variations
  const legacyMappings: Record<string, string> = {
    "tech": "technology",
    "it": "technology",
    "school": "education",
    "bank": "finance",
    "banking": "finance",
    "medical": "healthcare",
    "auto": "automotive",
    "car": "automotive",
    "food": "food-beverage",
    "restaurant": "food-beverage",
    "hotel": "tourism",
    "travel": "tourism",
    "government": "government",
    "public": "government",
    "ngo": "non-profit",
    "nonprofit": "non-profit"
  };

  const legacyMatch = legacyMappings[lowerSearch];
  if (legacyMatch) return legacyMatch;

  // If no match found, return "other"
  return "other";
};
