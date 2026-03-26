import { Module } from "@nestjs/common";
import { PropertiesController } from "./properties/properties.controller";
import { PropertiesService } from "./properties/properties.service";
import { ListingsController } from "./listings/listings.controller";
import { ListingsService } from "./listings/listings.service";
import { MediaController } from "./media/media.controller";
import { MediaService } from "./media/media.service";
import { PublicationsController } from "./publications/publications.controller";
import { PublicationsService } from "./publications/publications.service";

@Module({
  controllers: [PropertiesController, ListingsController, MediaController, PublicationsController],
  providers: [PropertiesService, ListingsService, MediaService, PublicationsService],
})
export class CatalogModule {}

