import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from "@nestjs/common";
import { PublicService } from "./public.service";
import { SearchListingsQueryDto } from "./dto/search-listings.query.dto";
import { CreateInquiryDto } from "./dto/inquiry.dto";

@Controller("public")
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

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
  ) {
    return this.publicService.getListingDetail(agencySlug, listingSlug);
  }

  @Get(":agencySlug/listings/:listingSlug/similar")
  getSimilarListings(
    @Param("agencySlug") agencySlug: string,
    @Param("listingSlug") listingSlug: string,
    @Query("limit", new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.publicService.getSimilarListings(agencySlug, listingSlug, limit ?? 6);
  }

  @Post(":agencySlug/listings/:listingSlug/inquiries")
  createInquiry(
    @Param("agencySlug") agencySlug: string,
    @Param("listingSlug") listingSlug: string,
    @Body() dto: CreateInquiryDto,
  ) {
    return this.publicService.createInquiry(agencySlug, listingSlug, dto);
  }
}

