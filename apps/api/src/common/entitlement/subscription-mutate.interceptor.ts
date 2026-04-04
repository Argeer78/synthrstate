import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, from } from "rxjs";
import { switchMap } from "rxjs/operators";
import type { JwtClaims } from "../../modules/auth/auth.types";
import { EntitlementService } from "./entitlement.service";

const MUTATING = new Set(["POST", "PATCH", "PUT", "DELETE"]);

function normalizePath(urlish: string): string {
  const path = urlish.split("?")[0] ?? "";
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

function isExemptPath(path: string): boolean {
  if (path.startsWith("/auth")) return true;
  if (path.startsWith("/public")) return true;
  if (path === "/billing/webhook") return true;
  if (path.startsWith("/health")) return true;
  if (path === "/billing/checkout-session" || path === "/billing/customer-portal-session") return true;
  return false;
}

/**
 * Blocks mutating API calls when the agency subscription is not entitled to write.
 * Runs after JWT auth; unauthenticated routes typically have no req.user and are skipped
 * unless they hit a mutating path with user (should not happen for public POSTs).
 */
@Injectable()
export class SubscriptionMutateInterceptor implements NestInterceptor {
  constructor(private readonly entitlement: EntitlementService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{ method?: string; path?: string; url?: string; user?: JwtClaims }>();
    const method = (req.method ?? "").toUpperCase();
    if (!MUTATING.has(method)) return next.handle();

    const path = normalizePath(req.path ?? req.url ?? "");
    if (isExemptPath(path)) return next.handle();

    const user = req.user;
    if (!user?.agencyId) return next.handle();

    return from(
      this.entitlement.assertAgencyCanMutate({
        agencyId: user.agencyId,
        userEmail: user.email,
      }),
    ).pipe(switchMap(() => next.handle()));
  }
}
