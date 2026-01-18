import { RoleType } from '@prisma/client';

export interface RequestUser {
  id: string;
  role: RoleType;
  countryId: string;
  patientId?: string | null;
  doctorId?: string | null;
  adminId?: string | null;
}
