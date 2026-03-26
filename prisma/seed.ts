import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function slugify(input: string) {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base.length > 0 ? base : "listing";
}

async function main() {
  const demoAgencySlug = "demo-agency";
  const ownerEmail = "owner@demo.local";
  const ownerPassword = "ChangeMe123!";

  const agency = await prisma.agency.upsert({
    where: { slug: demoAgencySlug },
    update: { name: "Demo Agency" },
    create: { name: "Demo Agency", slug: demoAgencySlug },
  });

  const passwordHash = await bcrypt.hash(ownerPassword, 12);

  const user = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: { fullName: "Demo Owner", passwordHash },
    create: {
      email: ownerEmail,
      fullName: "Demo Owner",
      passwordHash,
    },
  });

  await prisma.agencyMembership.upsert({
    where: { agencyId_userId: { agencyId: agency.id, userId: user.id } },
    update: { role: UserRole.OWNER },
    create: { agencyId: agency.id, userId: user.id, role: UserRole.OWNER },
  });

  const membership = await prisma.agencyMembership.findUniqueOrThrow({
    where: { agencyId_userId: { agencyId: agency.id, userId: user.id } },
  });

  // --- CRM demo data ---
  const contact1 = await prisma.contact.create({
    data: {
      agencyId: agency.id,
      firstName: "John",
      lastName: "Buyer",
      email: "john.buyer@demo.local",
      phone: "+10000000001",
      createdByMembershipId: membership.id,
    },
  });
  const contact2 = await prisma.contact.create({
    data: {
      agencyId: agency.id,
      firstName: "Sara",
      lastName: "Seller",
      email: "sara.seller@demo.local",
      phone: "+10000000002",
      createdByMembershipId: membership.id,
    },
  });

  const lead1 = await prisma.lead.create({
    data: {
      agencyId: agency.id,
      contactId: contact1.id,
      status: "NEW",
      title: "Looking for 2BR apartment",
      assignedToMembershipId: membership.id,
      createdByMembershipId: membership.id,
    },
  });
  const lead2 = await prisma.lead.create({
    data: {
      agencyId: agency.id,
      contactId: contact2.id,
      status: "QUALIFIED",
      title: "Wants to list property ASAP",
      assignedToMembershipId: membership.id,
      createdByMembershipId: membership.id,
    },
  });

  await prisma.note.createMany({
    data: [
      {
        agencyId: agency.id,
        contactId: contact1.id,
        content: "Prefers email contact. Budget range is flexible.",
        createdByMembershipId: membership.id,
      },
      {
        agencyId: agency.id,
        leadId: lead2.id,
        content: "Seller has paperwork ready. Needs valuation this week.",
        createdByMembershipId: membership.id,
      },
    ],
  });

  await prisma.task.createMany({
    data: [
      {
        agencyId: agency.id,
        title: "Call John to confirm requirements",
        description: "Discuss areas, budget, move-in date.",
        status: "TODO",
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        leadId: lead1.id,
        assignedToMembershipId: membership.id,
        createdByMembershipId: membership.id,
      },
      {
        agencyId: agency.id,
        title: "Schedule valuation meeting with Sara",
        status: "IN_PROGRESS",
        dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        leadId: lead2.id,
        assignedToMembershipId: membership.id,
        createdByMembershipId: membership.id,
      },
    ],
  });

  // --- Property + Listing demo data (10 listings) ---
  const ownerContactId = contact2.id; // reuse Sara as demo owner

  const properties = await Promise.all(
    [
      {
        address: "221B Garden Lane, Springfield",
        city: "Springfield",
        area: "Garden District",
        latitude: 37.7749,
        longitude: -122.4194,
        energyClass: "B",
        features: ["balcony", "elevator", "washer/dryer"],
      },
      {
        address: "78 Market Street, Springfield",
        city: "Springfield",
        area: "Downtown Market",
        latitude: 37.7849,
        longitude: -122.4094,
        energyClass: "C",
        features: ["parking", "heated floors", "modern kitchen"],
      },
      {
        address: "14 River View Ave, Springfield",
        city: "Springfield",
        area: "Riverside",
        latitude: 37.7649,
        longitude: -122.4294,
        energyClass: "A",
        features: ["river view", "security system"],
      },
      {
        address: "305 Cedar Grove Rd, Springfield",
        city: "Springfield",
        area: "Cedar Grove",
        latitude: 37.7549,
        longitude: -122.4394,
        energyClass: "D",
        features: ["garden", "storage room"],
      },
      {
        address: "9 Sunset Terrace, Springfield",
        city: "Springfield",
        area: "Sunset Heights",
        latitude: 37.7949,
        longitude: -122.3994,
        energyClass: "B",
        features: ["pet friendly", "gym access"],
      },
      {
        address: "66 Lakeside Blvd, Springfield",
        city: "Springfield",
        area: "Lakeside",
        latitude: 37.8049,
        longitude: -122.3894,
        energyClass: "C",
        features: ["lake view", "private patio"],
      },
      {
        address: "501 Oakwood Drive, Springfield",
        city: "Springfield",
        area: "Oakwood",
        latitude: 37.7349,
        longitude: -122.4594,
        energyClass: "E",
        features: ["garage", "renovated bathroom"],
      },
      {
        address: "27 Grove Street, Springfield",
        city: "Springfield",
        area: "Transit Corridor",
        latitude: 37.7249,
        longitude: -122.4694,
        energyClass: "UNKNOWN",
        features: ["near transit", "new paint"],
      },
      {
        address: "88 Highlands Way, Springfield",
        city: "Springfield",
        area: "Highlands",
        latitude: 37.8149,
        longitude: -122.3794,
        energyClass: "B",
        features: ["corner unit", "bright rooms"],
      },
      {
        address: "3 Kingfisher Court, Springfield",
        city: "Springfield",
        area: "Kingfisher Commons",
        latitude: 37.8249,
        longitude: -122.3694,
        energyClass: "C",
        features: ["balcony", "bike storage"],
      },
    ].map((p) =>
      prisma.property.create({
        data: {
          agencyId: agency.id,
          ownerContactId,
          address: p.address,
          city: (p as any).city,
          area: (p as any).area,
          latitude: p.latitude,
          longitude: p.longitude,
          energyClass: p.energyClass as any,
          features: p.features,
          createdByMembershipId: membership.id,
        },
      }),
    ),
  );

  const listingData = [
    {
      property: properties[0],
      listingType: "SALE",
      status: "ACTIVE",
      title: "Modern 2BR Apartment with Balcony",
      description: "Bright corner unit with a modern kitchen, spacious living area, and a private balcony. Close to parks and public transport.",
      price: 425000,
      currency: "USD",
      bedrooms: 2,
      bathrooms: 2,
      sqm: 86.5,
    },
    {
      property: properties[1],
      listingType: "RENT",
      status: "ACTIVE",
      title: "Renovated 3BR Townhome - Parking Included",
      description: "Renovated interiors with a dedicated parking spot and extra storage. Ideal for families seeking space and convenience.",
      price: 2650,
      currency: "USD",
      bedrooms: 3,
      bathrooms: 2,
      sqm: 132.0,
    },
    {
      property: properties[2],
      listingType: "SALE",
      status: "DRAFT",
      title: "River-View Loft with High Ceilings",
      description: "Architectural loft with river views, security system, and open-plan living. Ready for a tailored finishing package.",
      price: 615000,
      currency: "USD",
      bedrooms: 1,
      bathrooms: 1,
      sqm: 98.2,
    },
    {
      property: properties[3],
      listingType: "RENT",
      status: "ACTIVE",
      title: "Garden-Level Home with Storage & Quiet Street",
      description: "Ground-floor living with garden access, storage room, and a calm neighborhood feel. Great for long-term stays.",
      price: 1850,
      currency: "USD",
      bedrooms: 2,
      bathrooms: 1,
      sqm: 74.4,
    },
    {
      property: properties[4],
      listingType: "SALE",
      status: "ACTIVE",
      title: "Pet-Friendly 2BR with Gym Access",
      description: "Pet-friendly community with gym access. Enjoy natural light, updated interiors, and a comfortable balcony seating area.",
      price: 399000,
      currency: "USD",
      bedrooms: 2,
      bathrooms: 2,
      sqm: 81.7,
    },
    {
      property: properties[5],
      listingType: "RENT",
      status: "ACTIVE",
      title: "Lake View Apartment with Private Patio",
      description: "Lake-facing views from a private patio. Spacious layout, modern kitchen, and excellent natural light throughout.",
      price: 2350,
      currency: "USD",
      bedrooms: 2,
      bathrooms: 2,
      sqm: 104.9,
    },
    {
      property: properties[6],
      listingType: "SALE",
      status: "ARCHIVED",
      title: "Garage + Renovated Bathroom Family Home",
      description: "Family-ready home with a garage and renovated bathroom. Archived from active marketing but still available for review.",
      price: 520000,
      currency: "USD",
      bedrooms: 3,
      bathrooms: 2,
      sqm: 145.3,
    },
    {
      property: properties[7],
      listingType: "RENT",
      status: "ACTIVE",
      title: "Near Transit - Updated 1BR Apartment",
      description: "Updated 1BR near transit. Fresh paint, easy commute, and efficient layout—ideal for professionals.",
      price: 1400,
      currency: "USD",
      bedrooms: 1,
      bathrooms: 1,
      sqm: 52.8,
    },
    {
      property: properties[8],
      listingType: "SALE",
      status: "SOLD",
      title: "Corner Unit with Bright Rooms (Sold)",
      description: "A bright corner unit that has been sold. Included for demo timeline and status workflows.",
      price: 478000,
      currency: "USD",
      bedrooms: 2,
      bathrooms: 2,
      sqm: 90.1,
    },
    {
      property: properties[9],
      listingType: "RENT",
      status: "RENTED",
      title: "Balcony + Bike Storage (Rented)",
      description: "A convenient rental with balcony access and bike storage. Included for demo status workflows.",
      price: 1995,
      currency: "USD",
      bedrooms: 2,
      bathrooms: 1,
      sqm: 68.6,
    },
  ];

  const listings = await Promise.all(
    listingData.map((l) =>
      prisma.listing.create({
        data: {
          agencyId: agency.id,
          propertyId: l.property.id,
          listingType: l.listingType as any,
          status: l.status as any,
          title: l.title,
          slug: slugify(l.title),
          description: l.description,
          price: l.price,
          currency: l.currency,
          bedrooms: l.bedrooms,
          bathrooms: l.bathrooms,
          sqm: l.sqm,
          createdByMembershipId: membership.id,
        },
      }),
    ),
  );

  // Internal notes (kept out of any public mapping)
  await prisma.listingInternalNote.createMany({
    data: [
      {
        agencyId: agency.id,
        listingId: listings[0].id,
        content: "Send buyer brochure + schedule viewing for weekend slots.",
        createdByMembershipId: membership.id,
      },
      {
        agencyId: agency.id,
        listingId: listings[1].id,
        content: "Check building parking availability before confirming lease terms.",
        createdByMembershipId: membership.id,
      },
    ],
  });

  // --- Prompt templates for AI listing description generation ---
  const listingDescriptionTemplates: Array<{
    code: string;
    tone: string;
    name: string;
    systemPromptText: string;
    userPromptText: string;
  }> = [
    {
      code: "listing_description.standard",
      tone: "STANDARD",
      name: "Listing Description (Standard)",
      systemPromptText:
        "You are an expert real-estate marketing copywriter. Output strict JSON only.",
      userPromptText:
        [
          "Write two real-estate listing descriptions for the same property.",
          "Return ONLY valid JSON with keys: en and el.",
          "en must be English. el must be Greek (Modern Greek).",
          "",
          "TONE: {{tone}}",
          "",
          "Structured input:",
          "- Title: {{listingTitle}}",
          "- Type: {{listingType}}",
          "- Price: {{price}} {{currency}}",
          "- Bedrooms: {{bedrooms}}",
          "- Bathrooms: {{bathrooms}}",
          "- Area (sqm): {{sqm}}",
          "- Address: {{address}}",
          "- City: {{city}}",
          "- Area: {{area}}",
          "- Energy class: {{energyClass}}",
          "- Features: {{features}}",
          "",
          "Rules:",
          "- Make it compelling but truthful to the provided fields.",
          "- Do not include any markdown, only plain text inside JSON strings.",
          "- Keep each description under 900 characters.",
          "- Ensure both descriptions mention the property type, location (city/area if present), and the key specs.",
          "",
          "JSON format example: {\"en\":\"...\",\"el\":\"...\"}",
        ].join("\n"),
    },
    {
      code: "listing_description.premium",
      tone: "PREMIUM",
      name: "Listing Description (Premium)",
      systemPromptText:
        "You are an expert real-estate marketing copywriter. Output strict JSON only.",
      userPromptText:
        [
          "Write two real-estate listing descriptions for the same property.",
          "Return ONLY valid JSON with keys: en and el.",
          "en must be English. el must be Greek (Modern Greek).",
          "",
          "TONE: {{tone}}",
          "",
          "Structured input:",
          "- Title: {{listingTitle}}",
          "- Type: {{listingType}}",
          "- Price: {{price}} {{currency}}",
          "- Bedrooms: {{bedrooms}}",
          "- Bathrooms: {{bathrooms}}",
          "- Area (sqm): {{sqm}}",
          "- Address: {{address}}",
          "- City: {{city}}",
          "- Area: {{area}}",
          "- Energy class: {{energyClass}}",
          "- Features: {{features}}",
          "",
          "Rules:",
          "- Premium, luxurious style. Keep it factual.",
          "- Mention at least 3 standout features from Features.",
          "- Keep each description under 900 characters.",
          "- Output only JSON: {\"en\":\"...\",\"el\":\"...\"}",
        ].join("\n"),
    },
    {
      code: "listing_description.concise",
      tone: "CONCISE",
      name: "Listing Description (Concise)",
      systemPromptText:
        "You are an expert real-estate marketing copywriter. Output strict JSON only.",
      userPromptText:
        [
          "Write two concise listing descriptions for the same property.",
          "Return ONLY valid JSON with keys: en and el.",
          "en must be English. el must be Greek (Modern Greek).",
          "",
          "TONE: {{tone}}",
          "",
          "Structured input:",
          "- Title: {{listingTitle}}",
          "- Type: {{listingType}}",
          "- Price: {{price}} {{currency}}",
          "- Bedrooms: {{bedrooms}}",
          "- Bathrooms: {{bathrooms}}",
          "- Area (sqm): {{sqm}}",
          "- Address: {{address}}",
          "- City: {{city}}",
          "- Area: {{area}}",
          "- Features: {{features}}",
          "",
          "Rules:",
          "- Very short and skimmable (2-3 sentences).",
          "- Keep each description under 450 characters.",
          "- Output only JSON: {\"en\":\"...\",\"el\":\"...\"}",
        ].join("\n"),
    },
  ];

  for (const tpl of listingDescriptionTemplates) {
    const promptTemplate = await prisma.aiPromptTemplate.upsert({
      where: { agencyId_code: { agencyId: agency.id, code: tpl.code } },
      update: { name: tpl.name },
      create: { agencyId: agency.id, code: tpl.code, name: tpl.name },
    });

    await prisma.aiPromptTemplateVersion.upsert({
      where: {
        agencyId_promptTemplateId_versionNumber: {
          agencyId: agency.id,
          promptTemplateId: promptTemplate.id,
          versionNumber: 1,
        },
      },
      update: {
        systemPromptText: tpl.systemPromptText,
        userPromptText: tpl.userPromptText,
      },
      create: {
        agencyId: agency.id,
        promptTemplateId: promptTemplate.id,
        versionNumber: 1,
        systemPromptText: tpl.systemPromptText,
        userPromptText: tpl.userPromptText,
      },
    });
  }

  // --- Lead summary prompt template ---
  const leadSummaryTemplateCode = "lead_summary.standard";
  const leadSummaryPromptTemplate = await prisma.aiPromptTemplate.upsert({
    where: { agencyId_code: { agencyId: agency.id, code: leadSummaryTemplateCode } },
    update: { name: "Lead Summary (Standard)" },
    create: { agencyId: agency.id, code: leadSummaryTemplateCode, name: "Lead Summary (Standard)" },
  });

  await prisma.aiPromptTemplateVersion.upsert({
    where: {
      agencyId_promptTemplateId_versionNumber: {
        agencyId: agency.id,
        promptTemplateId: leadSummaryPromptTemplate.id,
        versionNumber: 1,
      },
    },
    update: {
      systemPromptText:
        "You are a real-estate CRM assistant. You must output strict JSON only.",
      userPromptText:
        [
          "Summarize the lead/contact context for a real-estate agent.",
          "Input includes: notes, tasks, and optionally inquiries.",
          "",
          "Return ONLY valid JSON with keys:",
          "- summaryEn: short actionable summary (<= 450 characters)",
          "- summaryEl: short actionable summary in Greek (<= 450 characters)",
          "- nextActionEn: one suggested next action (<= 200 characters)",
          "- nextActionEl: one suggested next action in Greek (<= 200 characters)",
          "",
          "LEAD:",
          "- Lead title: {{leadTitle}}",
          "- Lead status: {{leadStatus}}",
          "- Contact: {{contactName}}",
          "",
          "NOTES:",
          "{{notesText}}",
          "",
          "TASKS:",
          "{{tasksText}}",
          "",
          "INQUIRIES:",
          "{{inquiriesText}}",
          "",
          "Rules:",
          "- Keep it practical for an agent.",
          "- Do not invent facts not present in the input.",
        ].join("\n"),
    },
    create: {
      agencyId: agency.id,
      promptTemplateId: leadSummaryPromptTemplate.id,
      versionNumber: 1,
      systemPromptText:
        "You are a real-estate CRM assistant. You must output strict JSON only.",
      userPromptText:
        [
          "Summarize the lead/contact context for a real-estate agent.",
          "Input includes: notes, tasks, and optionally inquiries.",
          "",
          "Return ONLY valid JSON with keys:",
          "- summaryEn: short actionable summary (<= 450 characters)",
          "- summaryEl: short actionable summary in Greek (<= 450 characters)",
          "- nextActionEn: one suggested next action (<= 200 characters)",
          "- nextActionEl: one suggested next action in Greek (<= 200 characters)",
          "",
          "LEAD:",
          "- Lead title: {{leadTitle}}",
          "- Lead status: {{leadStatus}}",
          "- Contact: {{contactName}}",
          "",
          "NOTES:",
          "{{notesText}}",
          "",
          "TASKS:",
          "{{tasksText}}",
          "",
          "INQUIRIES:",
          "{{inquiriesText}}",
          "",
          "Rules:",
          "- Keep it practical for an agent.",
          "- Do not invent facts not present in the input.",
        ].join("\n"),
    },
  });

  // --- Buyer-property matching prompt template ---
  const buyerMatchTemplateCode = "buyer_property_match.standard";
  const buyerMatchPromptTemplate = await prisma.aiPromptTemplate.upsert({
    where: { agencyId_code: { agencyId: agency.id, code: buyerMatchTemplateCode } },
    update: { name: "Buyer Property Matching (Standard)" },
    create: {
      agencyId: agency.id,
      code: buyerMatchTemplateCode,
      name: "Buyer Property Matching (Standard)",
    },
  });

  await prisma.aiPromptTemplateVersion.upsert({
    where: {
      agencyId_promptTemplateId_versionNumber: {
        agencyId: agency.id,
        promptTemplateId: buyerMatchPromptTemplate.id,
        versionNumber: 1,
      },
    },
    update: {
      systemPromptText:
        "You are a real-estate matching engine assistant. Output strict JSON only.",
      userPromptText:
        [
          "You will be given a buyer's preferences and a shortlist of candidate listings.",
          "You must rank the best matches for the buyer.",
          "",
          "Return ONLY valid JSON with this schema:",
          "{",
          '  "results": [',
          "    {",
          '      "listingId": string,',
          '      "score": number (0..100),',
          '      "reasonsEn": string[] (2..5 items),',
          '      "reasonsEl": string[] (2..5 items)',
          "    }",
          "  ]",
          "}",
          "",
          "Only use listingIds from the candidates list. Do not invent listings.",
          "Do not invent facts not in the candidate objects.",
          "",
          "BUYER:",
          "- Title: {{buyerLeadTitle}}",
          "- Contact: {{buyerContactName}}",
          "",
          "PREFERENCES (may contain min/max price, bedrooms, city/area, feature keywords):",
          "{{preferences}}",
          "",
          "CANDIDATES (each has baseScore + baseReasonsEn/baseReasonsEl):",
          "{{candidates}}",
          "",
          "LIMIT: {{limit}}",
          "",
          "Rules:",
          "- Score should reflect fit. 100 = best fit.",
          "- Provide concise but specific reasons.",
        ].join("\n"),
    },
    create: {
      agencyId: agency.id,
      promptTemplateId: buyerMatchPromptTemplate.id,
      versionNumber: 1,
      systemPromptText:
        "You are a real-estate matching engine assistant. Output strict JSON only.",
      userPromptText:
        [
          "You will be given a buyer's preferences and a shortlist of candidate listings.",
          "You must rank the best matches for the buyer.",
          "",
          "Return ONLY valid JSON with this schema:",
          "{",
          '  "results": [',
          "    {",
          '      "listingId": string,',
          '      "score": number (0..100),',
          '      "reasonsEn": string[] (2..5 items),',
          '      "reasonsEl": string[] (2..5 items)',
          "    }",
          "  ]",
          "}",
          "",
          "Only use listingIds from the candidates list. Do not invent listings.",
          "Do not invent facts not in the candidate objects.",
          "",
          "BUYER:",
          "- Title: {{buyerLeadTitle}}",
          "- Contact: {{buyerContactName}}",
          "",
          "PREFERENCES (may contain min/max price, bedrooms, city/area, feature keywords):",
          "{{preferences}}",
          "",
          "CANDIDATES (each has baseScore + baseReasonsEn/baseReasonsEl):",
          "{{candidates}}",
          "",
          "LIMIT: {{limit}}",
          "",
          "Rules:",
          "- Score should reflect fit. 100 = best fit.",
          "- Provide concise but specific reasons.",
        ].join("\n"),
    },
  });

  // eslint-disable-next-line no-console
  console.log("Seeded demo agency + owner user:");
  // eslint-disable-next-line no-console
  console.log({
    agency: { id: agency.id, slug: agency.slug },
    user: { id: user.id, email: user.email },
    password: ownerPassword,
  });
}

main()
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

