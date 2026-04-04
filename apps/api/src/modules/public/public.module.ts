import { Module } from "@nestjs/common";
import { PublicController } from "./public.controller";
import { PublicService } from "./public.service";
import { CollaborationModule } from "../collaboration/collaboration.module";
import { TurnstileModule } from "../../common/turnstile/turnstile.module";

@Module({
  imports: [CollaborationModule, TurnstileModule],
  controllers: [PublicController],
  providers: [PublicService],
  exports: [PublicService],
})
export class PublicModule {}

