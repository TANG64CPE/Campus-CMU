/**
 * Helper utilities for User Profile contact validation and formatting
 */

export interface ContactData {
  phone?: string | null;
  lineId?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  meetingNote?: string | null;
  contactInfo?: string | null;
}

export function isValidThaiMobileNumber(phone?: string | null): boolean {
  const normalizedPhone = phone?.trim().replace(/[-\s]/g, '');
  return Boolean(
    normalizedPhone &&
    /^0[689]\d{8}$/.test(normalizedPhone) &&
    !/^([0-9])\1{9}$/.test(normalizedPhone)
  );
}

/**
 * Checks whether a user has satisfied mandatory profile contact requirements:
 * 1. Must have a valid phone number (Required)
 * 2. Must have at least 1 social media contact (Line, Facebook, or Instagram)
 */
export function isProfileContactComplete(user?: ContactData | null): boolean {
  if (!user) return false;

  const phone = user.phone?.trim();
  const lineId = user.lineId?.trim();
  const facebook = user.facebook?.trim();
  const instagram = user.instagram?.trim();

  const hasPhone = isValidThaiMobileNumber(phone);
  const hasSocial = Boolean(
    (lineId && lineId.length > 0) ||
    (facebook && facebook.length > 0) ||
    (instagram && instagram.length > 0)
  );

  return hasPhone && hasSocial;
}

/**
 * Formats structured contact details into a readable single-line summary
 */
export function formatContactSummary(data: ContactData): string {
  const parts: string[] = [];

  if (data.phone?.trim()) {
    parts.push(`โทร: ${data.phone.trim()}`);
  }
  if (data.lineId?.trim()) {
    parts.push(`Line: ${data.lineId.trim()}`);
  }
  if (data.facebook?.trim()) {
    parts.push(`FB: ${data.facebook.trim()}`);
  }
  if (data.instagram?.trim()) {
    parts.push(`IG: ${data.instagram.trim()}`);
  }
  if (data.meetingNote?.trim()) {
    parts.push(`จุดนัดพบ: ${data.meetingNote.trim()}`);
  }

  return parts.join(' | ');
}
