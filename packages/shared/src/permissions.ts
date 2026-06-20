import { Permission, RoleType } from "./types";

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
    Permission.VIEW_AUDIT_LOG
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
    Permission.MANAGE_WARRANTS
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
    Permission.MANAGE_WARRANTS
  ],
  [RoleType.FISCAL]: [
    Permission.VIEW_ASSIGNED_INVESTIGATIONS,
    Permission.EDIT_INVESTIGATION,
    Permission.MANAGE_SUBJECTS,
    Permission.VIEW_SUBJECTS,
    Permission.ADD_NOTES,
    Permission.VIEW_NOTES,
    Permission.UPLOAD_FILES
  ],
  [RoleType.FISCAL_AUXILIAR]: [
    Permission.VIEW_ASSIGNED_INVESTIGATIONS,
    Permission.VIEW_SUBJECTS,
    Permission.ADD_NOTES,
    Permission.VIEW_NOTES,
    Permission.UPLOAD_FILES
  ],
  [RoleType.INVESTIGADOR_SENIOR]: [
    Permission.VIEW_ALL_INVESTIGATIONS,
    Permission.VIEW_ASSIGNED_INVESTIGATIONS,
    Permission.EDIT_INVESTIGATION,
    Permission.MANAGE_SUBJECTS,
    Permission.VIEW_SUBJECTS,
    Permission.ADD_NOTES,
    Permission.VIEW_NOTES,
    Permission.UPLOAD_FILES
  ],
  [RoleType.INVESTIGADOR_JUNIOR]: [
    Permission.VIEW_ASSIGNED_INVESTIGATIONS,
    Permission.VIEW_SUBJECTS,
    Permission.ADD_NOTES,
    Permission.VIEW_NOTES,
    Permission.UPLOAD_FILES
  ],
  [RoleType.PASANTE]: [Permission.VIEW_ASSIGNED_INVESTIGATIONS]
};

export function hasPermission(role: RoleType, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

