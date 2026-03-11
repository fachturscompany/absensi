/**
 * Utility functions for handling user display names
 * Provides consistent logic for displaying user names across the application
 */

interface UserNameData {
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

/**
 * Get user's display name with fallback logic
 * Priority: display_name > first_name + last_name > email > 'User'
 */
export function getUserDisplayName(user?: UserNameData | null): string {
  if (!user) return 'User';

  const displayName = user.display_name?.trim();
  if (displayName && displayName.length > 0) {
    return displayName;
  }

  const nameParts = [
    user.first_name?.trim(),
    user.last_name?.trim(),
  ].filter(part => part && part.length > 0);

  if (nameParts.length > 0) {
    return nameParts.join(' ');
  }

  const email = user.email?.trim();
  return email && email.length > 0 ? email : 'User';
}

/**
 * Get user's short display name (for small UI elements)
 * Priority: display_name > first_name + last_name > first_name > email > 'User'
 */
export function getUserShortDisplayName(user?: UserNameData | null): string {
  if (!user) return 'User';

  const displayName = user.display_name?.trim();
  if (displayName && displayName.length > 0) {
    return displayName;
  }

  const firstName = user.first_name?.trim();
  const lastName = user.last_name?.trim();

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  if (firstName) {
    return firstName;
  }

  const email = user.email?.trim();
  return email && email.length > 0 ? email : 'User';
}

/**
 * Get user's formal display name (for formal contexts)
 * Priority: last_name, first_name > display_name > email > 'User'
 * Example: "Doe, John"
 */
export function getUserFormalDisplayName(user?: UserNameData | null): string {
  if (!user) return 'User';

  const firstName = user.first_name?.trim();
  const lastName = user.last_name?.trim();

  if (lastName && firstName) {
    return `${lastName}, ${firstName}`;
  }

  const displayName = user.display_name?.trim();
  if (displayName && displayName.length > 0) {
    return displayName;
  }

  const email = user.email?.trim();
  return email && email.length > 0 ? email : 'User';
}
