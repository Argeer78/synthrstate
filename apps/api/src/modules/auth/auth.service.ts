import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service";
import bcrypt from "bcryptjs";
import { UserRole, UserStatus } from "@prisma/client";
import type { JwtClaims } from "./auth.types";
import type { LoginDto } from "./dto/login.dto";
import type { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingAgency = await this.prisma.agency.findUnique({
      where: { slug: dto.agencySlug },
      select: { id: true },
    });
    if (existingAgency) throw new BadRequestException("Agency slug already exists");

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: { id: true },
    });
    if (existingUser) throw new BadRequestException("Email already in use");

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const result = await this.prisma.$transaction(async (tx) => {
      const agency = await tx.agency.create({
        data: { name: dto.agencyName, slug: dto.agencySlug },
      });
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          fullName: dto.fullName,
          passwordHash,
          status: UserStatus.ACTIVE,
        },
      });
      const membership = await tx.agencyMembership.create({
        data: {
          agencyId: agency.id,
          userId: user.id,
          role: UserRole.OWNER,
        },
      });
      return { agency, user, membership };
    });

    const token = await this.signAccessToken({
      sub: result.user.id,
      agencyId: result.agency.id,
      membershipId: result.membership.id,
      role: result.membership.role,
    });

    return {
      token,
      agency: { id: result.agency.id, slug: result.agency.slug, name: result.agency.name },
      user: { id: result.user.id, email: result.user.email, fullName: result.user.fullName },
      membership: { id: result.membership.id, role: result.membership.role },
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        memberships: { include: { agency: true } },
      },
    });

    if (!user) throw new UnauthorizedException("Invalid credentials");
    if (user.status !== UserStatus.ACTIVE) throw new UnauthorizedException("User disabled");

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");

    const membership =
      dto.agencySlug
        ? user.memberships.find((m) => m.agency.slug === dto.agencySlug)
        : user.memberships[0];

    if (!membership) throw new UnauthorizedException("No agency membership");

    const token = await this.signAccessToken({
      sub: user.id,
      agencyId: membership.agencyId,
      membershipId: membership.id,
      role: membership.role,
    });

    return {
      token,
      agency: { id: membership.agency.id, slug: membership.agency.slug, name: membership.agency.name },
      user: { id: user.id, email: user.email, fullName: user.fullName },
      membership: { id: membership.id, role: membership.role },
    };
  }

  async signAccessToken(claims: JwtClaims) {
    return this.jwt.signAsync(claims, { expiresIn: "7d" });
  }
}

