/**
 * Utility functions for handling avatar images safely
 */

/**
 * Safely format avatar src to prevent empty string issues
 * @param src - The source URL for the avatar image
 * @returns A valid URL string or null if the source is invalid
 */
export function safeAvatarSrc(src?: string | null): string | null {
  // Return null for any falsy values or empty strings
  if (!src || src === '' || src === 'null' || src === 'undefined') {
    return null
  }
  
  // Return the valid src
  return src
}

/**
 * Get user initials from name fields
 * @param firstName - User's first name
 * @param lastName - User's last name  
 * @param displayName - User's display name
 * @param email - User's email as fallback
 * @returns User initials (max 2 characters)
 */
export function getUserInitials(
  firstName?: string,
  lastName?: string,
  displayName?: string,
  email?: string
): string {
  // Try display name first
  if (displayName) {
    if (displayName.includes(' ')) {
      return displayName
        .split(' ')
        .map(n => n[0]?.toUpperCase())
        .join('')
        .slice(0, 2)
    }
    return displayName[0]?.toUpperCase() || 'U'
  }
  
  // Try first + last name
  if (firstName && lastName) {
    return `${firstName[0]?.toUpperCase()}${lastName[0]?.toUpperCase()}`
  }
  
  // Try just first name
  if (firstName) {
    return firstName[0]?.toUpperCase() || 'U'
  }
  
  // Try just last name
  if (lastName) {
    return lastName[0]?.toUpperCase() || 'U'
  }
  
  // Fallback to email first letter
  if (email) {
    return email[0]?.toUpperCase() || 'U'
  }
  
  // Final fallback
  return 'U'
}

/**
 * Check if a URL is a valid image URL
 * @param url - The URL to check
 * @returns boolean indicating if the URL is valid
 */
export function isValidImageUrl(url?: string | null): boolean {
  if (!url || url === '') return false
  
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
