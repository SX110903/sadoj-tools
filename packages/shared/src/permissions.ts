import { Permission, RoleType } from "./types";

const ACADEMY_STAFF_PERMISSIONS = [Permission.VIEW_ACADEMY, Permission.PUBLISH_ACADEMY, Permission.MANAGE_ACADEMY];

export const ROLE_PERMISSIONS: Readonly<Record<RoleType, readonly Permission[]>> = {
  [RoleType.FISCAL_GENERAL]: Object.values(Permission),
  [RoleType.FISCAL_ADJUNTO]: Object.values(Permission).filter(
    (permission) => permission !== Permission.MANAGE_ROLES && permission !== Permission.SYSTEM_CONFIG
  ),
  [RoleType.FISCAL_DIVISION]: [
    Permission.MANAGE_SANCTIONS,
    Permission.CREATE_INVESTIGATION,
    Permission.VIEW_ALL_INVESTIGATIONS,
    Permission.VIEW_ASSIGNED_INVESTIGATIONS,
    Permission.EDIT_INVESTIGATION,
    Permission.DELETE_INVESTIGATION,
    Permission.SHARE_INVESTIGATION,
    Permission.MANAGE_SUBJECTS,
    Permission.VIEW_SUBJECTS,
    Permission.ADD_NOTES,
    Permission.VIEW_NOTES,
    Permission.MANAGE_ZONES,
    Permission.UPLOAD_FILES,
    Permission.MANAGE_WARRANTS,
    Permission.VIEW_AUDIT_LOG,
    ...ACADEMY_STAFF_PERMISSIONS
  ],
  [RoleType.FISCAL_SUPERIOR]: [
    Permission.CREATE_INVESTIGATION,
    Permission.VIEW_ALL_INVESTIGATIONS,
    Permission.VIEW_ASSIGNED_INVESTIGATIONS,
    Permission.EDIT_INVESTIGATION,
    Permission.SHARE_INVESTIGATION,
    Permission.MANAGE_SUBJECTS,
    Permission.VIEW_SUBJECTS,
    Permission.ADD_NOTES,
    Permission.VIEW_NOTES,
    Permission.UPLOAD_FILES,
    Permission.MANAGE_WARRANTS,
    ...ACADEMY_STAFF_PERMISSIONS
  ],
  [RoleType.FISCAL_JEFE]: [
    Permission.CREATE_INVESTIGATION,
    Permission.VIEW_ASSIGNED_INVESTIGATIONS,
    Permission.EDIT_INVESTIGATION,
    Permission.SHARE_INVESTIGATION,
    Permission.MANAGE_SUBJECTS,
    Permission.VIEW_SUBJECTS,
    Permission.ADD_NOTES,
    Permission.VIEW_NOTES,
    Permission.UPLOAD_FILES,
    Permission.MANAGE_WARRANTS,
    ...ACADEMY_STAFF_PERMISSIONS
  ],
  [RoleType.FISCAL]: [
    Permission.VIEW_ASSIGNED_INVESTIGATIONS,
    Permission.EDIT_INVESTIGATION,
    Permission.MANAGE_SUBJECTS,
    Permission.VIEW_SUBJECTS,
    Permission.ADD_NOTES,
    Permission.VIEW_NOTES,
    Permission.UPLOAD_FILES,
    ...ACADEMY_STAFF_PERMISSIONS
  ],
  [RoleType.FISCAL_AUXILIAR]: [
    Permission.VIEW_ASSIGNED_INVESTIGATIONS,
    Permission.VIEW_SUBJECTS,
    Permission.ADD_NOTES,
    Permission.VIEW_NOTES,
    Permission.UPLOAD_FILES,
    Permission.VIEW_ACADEMY
  ],
  [RoleType.INVESTIGADOR_SENIOR]: [
    Permission.VIEW_ALL_INVESTIGATIONS,
    Permission.VIEW_ASSIGNED_INVESTIGATIONS,
    Permission.EDIT_INVESTIGATION,
    Permission.MANAGE_SUBJECTS,
    Permission.VIEW_SUBJECTS,
    Permission.ADD_NOTES,
    Permission.VIEW_NOTES,
    Permission.UPLOAD_FILES,
    Permission.VIEW_ACADEMY
  ],
  // Legal Staff is rank 0: Academy only, plus profile and exams managed through ownership.
  [RoleType.INVESTIGADOR_JUNIOR]: [Permission.VIEW_ACADEMY],
  [RoleType.PASANTE]: [Permission.VIEW_ASSIGNED_INVESTIGATIONS, Permission.VIEW_ACADEMY]
};

export function hasPermission(role: RoleType, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

// Academy-only users lack the base operational permission.
export function isAcademyOnly(role: RoleType): boolean {
  return !hasPermission(role, Permission.VIEW_ASSIGNED_INVESTIGATIONS);
}
