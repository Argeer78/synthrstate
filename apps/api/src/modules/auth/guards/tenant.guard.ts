import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import type { JwtClaims } from "../auth.types";

/**
 * Tenant isolation guard: ensures the request-scoped tenant is present.
 * We rely on JWT claims as the authoritative tenant context for MVP.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user as JwtClaims | undefined;
    if (!user?.agencyId || !user?.membershipId) {
      throw new ForbiddenException("Missing tenant context");
    }

    // Optional: allow callers to pass x-agency-id and ensure it matches token.
    const headerAgencyId = req.headers?.["x-agency-id"];
    if (typeof headerAgencyId === "string" && headerAgencyId !== user.agencyId) {
      throw new ForbiddenException("Agency mismatch");
    }

    return true;
  }
}

