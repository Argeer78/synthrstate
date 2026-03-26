import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { CommentsController } from "./comments.controller";
import { CommentsService } from "./comments.service";
import { AttachmentsController } from "./attachments.controller";
import { AttachmentsService } from "./attachments.service";

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController, CommentsController, AttachmentsController],
  providers: [NotificationsService, CommentsService, AttachmentsService],
  exports: [NotificationsService],
})
export class CollaborationModule {}

