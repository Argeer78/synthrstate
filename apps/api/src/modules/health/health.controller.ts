import { Controller, Get } from "@nestjs/common";

/**
 * Public uptime/smoke check. No auth — use /admin/health for authenticated admin probes.
 */
@Controller("health")
export class HealthController {
  @Get()
  getHealth() {
    return { ok: true };
  }
}
