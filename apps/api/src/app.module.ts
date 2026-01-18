import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuditModule } from './common/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { PatientOnboardingModule } from './modules/patient-onboarding/patient-onboarding.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuditModule,
    PrismaModule,
    AuthModule,
    PatientOnboardingModule,
  ],
})
export class AppModule {}
