import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./modules/health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { MeModule } from "./modules/me/me.module";
import { AdminModule } from "./modules/admin/admin.module";
import { CrmModule } from "./modules/crm/crm.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { PublicModule } from "./modules/public/public.module";
import { AiModule } from "./modules/ai/ai.module";

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
  ],
})
export class AppModule {}

