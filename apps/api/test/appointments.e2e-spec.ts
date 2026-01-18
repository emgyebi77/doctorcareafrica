import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { AppointmentsService } from '../src/modules/appointments/appointments.service';

describe('Appointments (e2e)', () => {
  let app: INestApplication;
  const appointmentsService = {
    createAvailability: jest.fn(),
    bookAppointment: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideProvider(AppointmentsService)
      .useValue(appointmentsService)
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

  it('POST /appointments/availability returns success', async () => {
    appointmentsService.createAvailability.mockResolvedValue({ success: true });

    await request(app.getHttpServer())
      .post('/api/v1/appointments/availability')
      .send({
        type: 'SPECIFIC_DATE',
        date: '2025-01-01T00:00:00Z',
        startTime: '2025-01-01T09:00:00Z',
        endTime: '2025-01-01T10:00:00Z',
        timezone: 'Africa/Accra',
      })
      .expect(200);
  });

  it('POST /appointments returns success', async () => {
    appointmentsService.bookAppointment.mockResolvedValue({ success: true });

    await request(app.getHttpServer())
      .post('/api/v1/appointments')
      .send({ timeSlotId: 'b7bfc4cc-7c99-4b7e-9f4e-1f0a3af1a111' })
      .expect(200);
  });
});
