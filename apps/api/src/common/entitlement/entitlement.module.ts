import { Global, Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { EntitlementService } from "./entitlement.service";
import { SubscriptionMutateInterceptor } from "./subscription-mutate.interceptor";

@Global()
@Module({
  providers: [
    EntitlementService,
    {
      provide: APP_INTERCEPTOR,
      useClass: SubscriptionMutateInterceptor,
    },
  ],
  exports: [EntitlementService],
})
export class EntitlementModule {}
