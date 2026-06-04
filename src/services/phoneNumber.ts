import {
  parsePhoneNumber,
  isValidPhoneNumber,
  PhoneNumber,
} from 'libphonenumber-js';
import type {Country} from '../types/Rule';

export function toE164(raw: string, country: Country = 'FR'): string | null {
  try {
    const cleaned = raw.trim();
    if (!cleaned) {
      return null;
    }
    let parsed: PhoneNumber | undefined;
    // Try parsing as-is first (handles E.164 and 00-prefixed international)
    try {
      parsed = parsePhoneNumber(cleaned, country);
    } catch {
      return null;
    }
    if (!parsed || !isValidPhoneNumber(cleaned, country)) {
      return null;
    }
    return parsed.format('E.164');
  } catch {
    return null;
  }
}

// Converts a raw prefix pattern ("03", "+333", "0033") to an E.164 prefix string.
// Returns null if the pattern cannot be interpreted as a French prefix.
export function normalizePrefixPattern(
  raw: string,
  country: Country = 'FR',
): string | null {
  const cleaned = raw.trim().replace(/[\s\-().]/g, '');
  if (!cleaned) {
    return null;
  }

  // Already E.164 prefix (e.g. "+333")
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // International with 00 prefix (e.g. "0033")
  if (cleaned.startsWith('00')) {
    return '+' + cleaned.slice(2);
  }

  // French national prefix: map country code for FR
  const countryCallingCodes: Record<Country, string> = {FR: '33'};
  const callingCode = countryCallingCodes[country];

  if (country === 'FR') {
    // National number starts with 0 (e.g. "03" → "+333")
    if (cleaned.startsWith('0')) {
      return '+' + callingCode + cleaned.slice(1);
    }
  }

  return null;
}

// French emergency numbers (E.164 form)
const FR_EMERGENCY_NUMBERS = new Set([
  '+33112', // 112 — European emergency
  '+3315',  // 15 — SAMU
  '+3317',  // 17 — Police
  '+3318',  // 18 — Fire
]);

export function isEmergencyNumber(e164: string): boolean {
  for (const em of FR_EMERGENCY_NUMBERS) {
    if (e164.startsWith(em)) {
      return true;
    }
  }
  return false;
}
