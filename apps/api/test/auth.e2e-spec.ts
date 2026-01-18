import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { AuthService } from '../src/modules/auth/auth.service';

describe('AuthModule (e2e)', () => {
  let app: INestApplication;
  const authService = {
    login: jest.fn(),
    requestOtp: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AuthService)
      .useValue(authService)
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

  it('POST /auth/login returns tokens', async () => {
    authService.login.mockResolvedValue({
      user: {
        id: 'user-id',
        email: 'patient@example.com',
        role: 'PATIENT',
        countryId: 'country-id',
      },
      tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
    });

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier: 'patient@example.com', password: 'Password123!' })
      .expect(200);
  });

  it('POST /auth/otp/request returns success', async () => {
    authService.requestOtp.mockResolvedValue({ success: true });

    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/request')
      .send({ identifier: 'patient@example.com', channel: 'EMAIL' })
      .expect(200);
  });
});
