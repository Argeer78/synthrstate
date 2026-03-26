import { ForbiddenException } from "@nestjs/common";
import { UserRole } from "@prisma/client";

/** Owner/Manager may assign to anyone; Agents may only assign records to themselves. */
export function assertAgentAssignsSelfOnly(
  role: UserRole,
  membershipId: string,
  assignedToMembershipId: string | null | undefined,
) {
  if (role !== UserRole.AGENT) return;
  if (assignedToMembershipId == null || assignedToMembershipId === "") return;
  if (assignedToMembershipId !== membershipId) {
    throw new ForbiddenException("Agents may only assign to themselves");
  }
}
