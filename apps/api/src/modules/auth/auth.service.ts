import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service";
import bcrypt from "bcryptjs";
import { AgencySubscriptionStatus, SubscriptionPlanCode, UserRole, UserStatus } from "@prisma/client";
import { createHash, randomBytes } from "crypto";
import type { JwtClaims } from "./auth.types";
import type { LoginDto } from "./dto/login.dto";
import type { RegisterDto } from "./dto/register.dto";
import type { ForgotPasswordDto } from "./dto/forgot-password.dto";
import type { ResetPasswordDto } from "./dto/reset-password.dto";
import { EmailService } from "../email/email.service";
import { TurnstileService } from "../../common/turnstile/turnstile.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly email: EmailService,
    private readonly turnstile: TurnstileService,
  ) {}

  async register(dto: RegisterDto, remoteIp?: string) {
    await this.turnstile.assertValidResponse("signup", dto.turnstileToken, remoteIp);
    const trialDays = Number(process.env.BILLING_TRIAL_DAYS ?? 30);
    const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

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

      await tx.subscriptionPlan.upsert({
        where: { code: SubscriptionPlanCode.STARTER },
        update: {
          name: "Starter",
          currency: "EUR",
          seatLimit: 3,
          features: ["CRM core", "Listings core", "Basic support"],
        },
        create: {
          code: SubscriptionPlanCode.STARTER,
          name: "Starter",
          currency: "EUR",
          seatLimit: 3,
          features: ["CRM core", "Listings core", "Basic support"],
        },
      });

      await tx.agencySubscription.create({
        data: {
          agencyId: agency.id,
          planCode: SubscriptionPlanCode.STARTER,
          status: AgencySubscriptionStatus.TRIALING,
          trialEndsAt,
        },
      });

      return { agency, user, membership };
    });

    try {
      await this.email.sendWelcomeEmail({
        to: result.user.email,
        ownerName: result.user.fullName,
        agencyName: result.agency.name,
      });
    } catch {
      // Keep signup resilient if SMTP is temporarily unavailable.
    }

    const token = await this.signAccessToken({
      sub: result.user.id,
      agencyId: result.agency.id,
      membershipId: result.membership.id,
      role: result.membership.role,
      email: result.user.email,
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
      email: user.email,
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

  async forgotPassword(dto: ForgotPasswordDto, requestedFromIp?: string) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, fullName: true },
    });
    if (!user) return { ok: true };

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const ttlMinutes = Number(process.env.PASSWORD_RESET_TOKEN_EXPIRES_MINUTES ?? 60);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      await tx.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });
    });

    const adminBase = (process.env.ADMIN_APP_URL ?? process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://app.synthrstate.com").replace(/\/$/, "");
    const resetUrl = `${adminBase}/reset-password/?token=${encodeURIComponent(rawToken)}`;
    await this.email.sendPasswordResetEmail({
      to: user.email,
      resetUrl,
      requestedFromIp,
    });

    return { ok: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const token = dto.token.trim();
    if (!token) throw new BadRequestException("Invalid password reset token");
    const tokenHash = createHash("sha256").update(token).digest("hex");

    const row = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, usedAt: true, expiresAt: true },
    });

    if (!row || row.usedAt || row.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException("Invalid or expired password reset token");
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: row.userId }, data: { passwordHash } });
      await tx.passwordResetToken.updateMany({
        where: { userId: row.userId, usedAt: null },
        data: { usedAt: new Date() },
      });
    });

    return { ok: true };
  }

  async changePassword(params: { userId: string; currentPassword: string; newPassword: string }) {
    if (!params.userId) throw new UnauthorizedException("Unauthorized");
    const user = await this.prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true, passwordHash: true },
    });
    if (!user) throw new UnauthorizedException("Unauthorized");

    const ok = await bcrypt.compare(params.currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Current password is incorrect");

    const passwordHash = await bcrypt.hash(params.newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return { ok: true };
  }
}

