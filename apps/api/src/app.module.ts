import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { RolesGuard } from "./modules/auth/guards/roles.guard";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./modules/health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { MeModule } from "./modules/me/me.module";
import { AdminModule } from "./modules/admin/admin.module";
import { CrmModule } from "./modules/crm/crm.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { PublicModule } from "./modules/public/public.module";
import { AiModule } from "./modules/ai/ai.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { AdminUsersModule } from "./modules/admin-users/admin-users.module";
import { BillingModule } from "./modules/billing/billing.module";
import { GmailModule } from "./modules/gmail/gmail.module";
import { CollaborationModule } from "./modules/collaboration/collaboration.module";
import { OnboardingModule } from "./modules/onboarding/onboarding.module";
import { EntitlementModule } from "./common/entitlement/entitlement.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HealthModule,
    PrismaModule,
    AuthModule,
    MeModule,
    AdminModule,
    CrmModule,
    CatalogModule,
    PublicModule,
    AiModule,
    DashboardModule,
    AdminUsersModule,
    BillingModule,
    GmailModule,
    CollaborationModule,
    OnboardingModule,
    EntitlementModule,
  ],
  providers: [RolesGuard],
})
export class AppModule {}

