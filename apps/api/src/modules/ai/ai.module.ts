import { Module } from "@nestjs/common";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { OpenAiProvider } from "./providers/openai.provider";

@Module({
  controllers: [AiController],
  providers: [AiService, OpenAiProvider],
  exports: [AiService],
})
export class AiModule {}

