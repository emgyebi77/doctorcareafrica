import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { TelemedicineService } from '../src/modules/telemedicine/telemedicine.service';

describe('Telemedicine (e2e)', () => {
  let app: INestApplication;
  const telemedicineService = {
    createSession: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideProvider(TelemedicineService)
      .useValue(telemedicineService)
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

  it('POST /telemedicine/sessions returns success', async () => {
    telemedicineService.createSession.mockResolvedValue({ success: true });

    await request(app.getHttpServer())
      .post('/api/v1/telemedicine/sessions')
      .send({ appointmentId: 'b7bfc4cc-7c99-4b7e-9f4e-1f0a3af1a111' })
      .expect(200);
  });
});
