import { Module } from "@nestjs/common";
import { GmailController } from "./gmail.controller";
import { GmailService } from "./gmail.service";
import { OpenAiProvider } from "../ai/providers/openai.provider";

@Module({
  controllers: [GmailController],
  providers: [GmailService, OpenAiProvider],
})
export class GmailModule {}

