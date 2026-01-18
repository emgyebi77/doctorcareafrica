import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PatientOnboardingController } from './patient-onboarding.controller';
import { PatientOnboardingService } from './patient-onboarding.service';

@Module({
  imports: [AuthModule],
  controllers: [PatientOnboardingController],
  providers: [PatientOnboardingService],
})
export class PatientOnboardingModule {}
