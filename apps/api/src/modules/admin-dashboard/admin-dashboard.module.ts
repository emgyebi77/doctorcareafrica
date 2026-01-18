import { Module } from '@nestjs/common';

import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { DoctorOnboardingModule } from '../doctor-onboarding/doctor-onboarding.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [DoctorOnboardingModule, PaymentsModule],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
})
export class AdminDashboardModule {}
