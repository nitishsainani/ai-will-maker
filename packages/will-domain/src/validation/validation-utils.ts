import type { ValidationProfile } from './validation-specification.port';

export const ALLOCATION_TOLERANCE = 0.01;
export const MIN_WITNESSES = 2;

export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function appliesToProfiles(
  profile: ValidationProfile,
  profiles: ValidationProfile[],
): boolean {
  return profiles.includes(profile);
}
