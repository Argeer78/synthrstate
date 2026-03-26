import { IsArray, ArrayMinSize, IsIn } from "class-validator";
import { PUBLICATION_CHANNELS, type PublicationChannelCode } from "../publications.constants";

export const PUBLICATION_CHANNEL_CODE_VALUES = PUBLICATION_CHANNELS.map((c) => c.code) as unknown as PublicationChannelCode[];

export class ListingPublicationChannelsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(PUBLICATION_CHANNEL_CODE_VALUES, { each: true })
  channels!: PublicationChannelCode[];
}

