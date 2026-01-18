import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PatientOnboardingService } from '../src/modules/patient-onboarding/patient-onboarding.service';

describe('PatientOnboarding (e2e)', () => {
  let app: INestApplication;
  const onboardingService = {
    requestPhoneOtp: jest.fn(),
    listCountries: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PatientOnboardingService)
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

  it('POST /patient-onboarding/phone/request-otp returns success', async () => {
    onboardingService.requestPhoneOtp.mockResolvedValue({ success: true });

    await request(app.getHttpServer())
      .post('/api/v1/patient-onboarding/phone/request-otp')
      .send({ phone: '+23300000000', countryId: 'b7bfc4cc-7c99-4b7e-9f4e-1f0a3af1a111' })
      .expect(200);
  });

  it('GET /patient-onboarding/countries returns list', async () => {
    onboardingService.listCountries.mockResolvedValue({ countries: [] });

    await request(app.getHttpServer())
      .get('/api/v1/patient-onboarding/countries')
      .expect(200);
  });
});
