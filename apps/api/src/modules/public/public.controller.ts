import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, Res } from "@nestjs/common";
import type { Request } from "express";
import type { Response } from "express";
import { PublicService } from "./public.service";
import { SearchListingsQueryDto } from "./dto/search-listings.query.dto";
import { CreateInquiryDto } from "./dto/inquiry.dto";
import { getClientIp } from "../../common/http/client-ip.util";

@Controller("public")
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get("resolve-agency")
  resolveAgency(
    @Query("host") host?: string,
    @Query("listingSlug") listingSlug?: string,
  ) {
    return this.publicService.resolveAgencySlug({ host, listingSlug });
  }

  @Get(":agencySlug/listings")
  searchListings(
    @Param("agencySlug") agencySlug: string,
    @Query() query: SearchListingsQueryDto,
  ) {
    return this.publicService.searchListings(agencySlug, query);
  }

  @Get(":agencySlug/listings/:listingSlug")
  getListingDetail(
    @Param("agencySlug") agencySlug: string,
    @Param("listingSlug") listingSlug: string,
    @Query("lang") lang?: string,
  ) {
    return this.publicService.getListingDetail(agencySlug, listingSlug, lang);
  }

  @Get(":agencySlug/listings/:listingSlug/similar")
  getSimilarListings(
    @Param("agencySlug") agencySlug: string,
    @Param("listingSlug") listingSlug: string,
    @Query("limit", new ParseIntPipe({ optional: true })) limit?: number,
    @Query("lang") lang?: string,
  ) {
    return this.publicService.getSimilarListings(agencySlug, listingSlug, limit ?? 6, lang);
  }

  @Get(":agencySlug/feeds/xml")
  getXmlFeed(
    @Param("agencySlug") agencySlug: string,
    @Query("lang") lang?: string,
    @Res() res?: Response,
  ) {
    return this.publicService.getXmlFeed(agencySlug, lang).then((payload) => {
      if (res) {
        res.setHeader("content-type", payload.contentType);
        res.send(payload.xml);
        return;
      }
      return payload.xml;
    });
  }

  @Post(":agencySlug/listings/:listingSlug/inquiries")
  createInquiry(
    @Req() req: Request,
    @Param("agencySlug") agencySlug: string,
    @Param("listingSlug") listingSlug: string,
    @Body() dto: CreateInquiryDto,
  ) {
    return this.publicService.createInquiry(agencySlug, listingSlug, dto, getClientIp(req));
  }
}

