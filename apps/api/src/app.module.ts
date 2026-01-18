import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuditModule } from './common/audit/audit.module';
import { CountryModule } from './common/country/country.module';
import { LoggingMiddleware } from './common/observability/logging.middleware';
import { ObservabilityModule } from './common/observability/observability.module';
import { AuthModule } from './modules/auth/auth.module';
import { DoctorOnboardingModule } from './modules/doctor-onboarding/doctor-onboarding.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { TelemedicineModule } from './modules/telemedicine/telemedicine.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { MedicalRecordsModule } from './modules/medical-records/medical-records.module';
import { AdminDashboardModule } from './modules/admin-dashboard/admin-dashboard.module';
import { AiModule } from './modules/ai/ai.module';
import { PatientOnboardingModule } from './modules/patient-onboarding/patient-onboarding.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuditModule,
    CountryModule,
    ObservabilityModule,
    PrismaModule,
    AuthModule,
    DoctorOnboardingModule,
    AppointmentsModule,
    TelemedicineModule,
    PaymentsModule,
    MedicalRecordsModule,
    AdminDashboardModule,
    AiModule,
    PatientOnboardingModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
