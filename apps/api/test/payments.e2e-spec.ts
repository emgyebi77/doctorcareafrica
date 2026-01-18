import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { PaymentsService } from '../src/modules/payments/payments.service';

describe('Payments (e2e)', () => {
  let app: INestApplication;
  const paymentsService = {
    createCheckout: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideProvider(PaymentsService)
      .useValue(paymentsService)
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

  it('POST /payments/checkout returns success', async () => {
    paymentsService.createCheckout.mockResolvedValue({ paymentId: 'payment-id' });

    await request(app.getHttpServer())
      .post('/api/v1/payments/checkout')
      .send({
        amount: 50,
        currency: 'GHS',
        provider: 'MOMO',
        momoPhone: '+23300000000',
      })
      .expect(200);
  });
});
