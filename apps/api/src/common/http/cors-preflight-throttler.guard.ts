import { ExecutionContext, Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

/**
 * Global throttler must not rate-limit CORS preflight (OPTIONS), or browsers see a
 * response without Access-Control-* headers and report a generic CORS failure.
 */
@Injectable()
export class CorsPreflightSafeThrottlerGuard extends ThrottlerGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ method?: string }>();
    if ((req.method ?? "").toUpperCase() === "OPTIONS") {
      return true;
    }
    return super.canActivate(context);
  }
}
