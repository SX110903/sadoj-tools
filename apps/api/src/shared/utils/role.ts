import { ROLE_LEVEL, RoleType } from "@sadoj/shared";

export function isRoleAbove(requesterRole: RoleType, targetRole: RoleType): boolean {
  return ROLE_LEVEL[requesterRole] > ROLE_LEVEL[targetRole];
}

export function canSeeConfidentialNotes(role: RoleType): boolean {
  return ROLE_LEVEL[role] >= ROLE_LEVEL[RoleType.FISCAL_JEFE];
}

