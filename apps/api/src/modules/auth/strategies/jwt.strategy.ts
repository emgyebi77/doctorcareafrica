import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RoleType } from '@prisma/client';

import { RequestUser } from '../../../common/interfaces/request-user.interface';

interface JwtPayload {
  sub: string;
  role: RoleType;
  countryId: string;
  patientId?: string | null;
  doctorId?: string | null;
  adminId?: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET', 'change-me'),
    });
  }

  validate(payload: JwtPayload): RequestUser {
    return {
      id: payload.sub,
      role: payload.role,
      countryId: payload.countryId,
      patientId: payload.patientId ?? null,
      doctorId: payload.doctorId ?? null,
      adminId: payload.adminId ?? null,
    };
  }
}
