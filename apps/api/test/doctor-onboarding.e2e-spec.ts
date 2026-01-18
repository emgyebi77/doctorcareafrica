import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { DoctorOnboardingService } from '../src/modules/doctor-onboarding/doctor-onboarding.service';

describe('DoctorOnboarding (e2e)', () => {
  let app: INestApplication;
  const onboardingService = {
    requestOtp: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DoctorOnboardingService)
      .useValue(onboardingService)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /doctor-onboarding/request-otp returns success', async () => {
    onboardingService.requestOtp.mockResolvedValue({ success: true });

    await request(app.getHttpServer())
      .post('/api/v1/doctor-onboarding/request-otp')
      .send({ channel: 'EMAIL', email: 'doctor@example.com', countryId: 'b7bfc4cc-7c99-4b7e-9f4e-1f0a3af1a111' })
      .expect(200);
  });
});
