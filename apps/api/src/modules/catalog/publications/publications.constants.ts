import { PublicationChannelType } from "@prisma/client";

export const PUBLICATION_CHANNELS = [
  { code: "WEBSITE", displayName: "Website", channelType: PublicationChannelType.WEBSITE },
  { code: "XML_FEED", displayName: "XML Feed", channelType: PublicationChannelType.WEBSITE },
  { code: "PORTAL", displayName: "Portal", channelType: PublicationChannelType.PORTAL },
] as const;

export type PublicationChannelCode = (typeof PUBLICATION_CHANNELS)[number]["code"];

export function isPublicationChannelCode(code: string): code is PublicationChannelCode {
  return PUBLICATION_CHANNELS.some((c) => c.code === code);
}

export function getPublicationChannelConfig(code: PublicationChannelCode) {
  const c = PUBLICATION_CHANNELS.find((x) => x.code === code);
  if (!c) throw new Error(`Unknown publication channel: ${code}`);
  return c;
}

