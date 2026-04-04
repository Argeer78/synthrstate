import { Body, Controller, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import type { Response } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { getClientIp } from "../../common/http/client-ip.util";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  async register(@Req() req: Request, @Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.register(dto, getClientIp(req));
    this.setSessionCookie(res, result.token);
    return result;
  }

  @Post("login")
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(dto);
    this.setSessionCookie(res, result.token);
    return result;
  }

  @Post("logout")
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("synthr_token", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    return { ok: true };
  }

  @Post("forgot-password")
  async forgotPassword(@Req() req: Request, @Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto, getClientIp(req));
  }

  @Post("reset-password")
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post("change-password")
  async changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    const userId = String((req as any).user?.sub ?? "");
    return this.auth.changePassword({ userId, currentPassword: dto.currentPassword, newPassword: dto.newPassword });
  }

  private setSessionCookie(res: Response, token: string) {
    res.cookie("synthr_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}

