import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { JwtClaims } from "./auth.types";

function cookieExtractor(req: any): string | null {
  const token = req?.cookies?.["synthr_token"];
  return typeof token === "string" && token.length > 0 ? token : null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? "dev-only-change-me",
    });
  }

  async validate(payload: JwtClaims) {
    return payload;
  }
}

