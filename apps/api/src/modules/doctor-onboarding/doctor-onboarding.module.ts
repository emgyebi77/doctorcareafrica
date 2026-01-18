import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DoctorOnboardingController } from './doctor-onboarding.controller';
import { DoctorOnboardingService } from './doctor-onboarding.service';

@Module({
  imports: [AuthModule],
  controllers: [DoctorOnboardingController],
  providers: [DoctorOnboardingService],
})
export class DoctorOnboardingModule {}
