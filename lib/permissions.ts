export function hasAccess(
  role: string,
  allowedRoles: string[]
) {
  return allowedRoles.includes(role);
}