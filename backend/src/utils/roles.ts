export const ADMIN_ROLES = ['ADMIN', 'ADMIN1', 'ADMIN2', 'ADMIN3'] as const;
export const ADMIN_ROLE_SLOTS = ['ADMIN1', 'ADMIN2', 'ADMIN3'] as const;

export const isAdminRole = (role?: string | null): boolean =>
  role !== undefined && role !== null && (ADMIN_ROLES as readonly string[]).includes(role);

export const isNumberedAdminRole = (role?: string | null): role is (typeof ADMIN_ROLE_SLOTS)[number] =>
  role !== undefined && role !== null && (ADMIN_ROLE_SLOTS as readonly string[]).includes(role);
