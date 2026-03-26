import { Module } from "@nestjs/common";
import { ContactsController } from "./contacts/contacts.controller";
import { ContactsService } from "./contacts/contacts.service";
import { LeadsController } from "./leads/leads.controller";
import { LeadsService } from "./leads/leads.service";
import { TasksController } from "./tasks/tasks.controller";
import { TasksService } from "./tasks/tasks.service";
import { NotesController } from "./notes/notes.controller";
import { NotesService } from "./notes/notes.service";
import { ActivityController } from "./timeline/activity.controller";
import { ActivityService } from "./timeline/activity.service";

@Module({
  controllers: [
    ContactsController,
    LeadsController,
    TasksController,
    NotesController,
    ActivityController,
  ],
  providers: [ContactsService, LeadsService, TasksService, NotesService, ActivityService],
})
export class CrmModule {}

