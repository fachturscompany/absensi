/**
 * Organization Type Detector
 * Detects organization type (corporate/government/education) based on industry
 */

export type OrganizationType = 'corporate' | 'government' | 'education';

/**
 * Detect organization type based on industry field
 * 
 * @param industry - The industry value from organizations table
 * @returns OrganizationType - corporate, government, or education
 */
export function getOrganizationType(industry: string | null | undefined): OrganizationType {
  if (!industry) return 'corporate'; // Default to corporate
  
  const industryLower = industry.toLowerCase().trim();
  
  // Government organizations
  if (industryLower === 'government') {
    return 'government';
  }
  
  // Education organizations
  if (industryLower === 'education') {
    return 'education';
  }
  
  // All other industries = Corporate
  // (technology, manufacturing, healthcare, finance, retail, etc.)
  return 'corporate';
}

/**
 * Check if organization is corporate type
 */
export function isCorporate(industry: string | null | undefined): boolean {
  return getOrganizationType(industry) === 'corporate';
}

/**
 * Check if organization is government type
 */
export function isGovernment(industry: string | null | undefined): boolean {
  return getOrganizationType(industry) === 'government';
}

/**
 * Check if organization is education type
 */
export function isEducation(industry: string | null | undefined): boolean {
  return getOrganizationType(industry) === 'education';
}

/**
 * Get organization type display name
 */
export function getOrganizationTypeLabel(industry: string | null | undefined): string {
  const type = getOrganizationType(industry);
  
  const labels: Record<OrganizationType, string> = {
    corporate: 'Corporate',
    government: 'Government',
    education: 'Education'
  };
  
  return labels[type];
}
