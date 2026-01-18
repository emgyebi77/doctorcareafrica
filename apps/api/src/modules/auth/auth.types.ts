import { RoleType } from '@prisma/client';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedUser {
  id: string;
  role: RoleType;
  countryId: string;
  patientId?: string | null;
  doctorId?: string | null;
  adminId?: string | null;
}
