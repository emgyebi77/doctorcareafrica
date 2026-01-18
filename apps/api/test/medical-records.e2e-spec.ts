import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { MedicalRecordsService } from '../src/modules/medical-records/medical-records.service';

describe('MedicalRecords (e2e)', () => {
  let app: INestApplication;
  const recordsService = {
    getMedicalRecord: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideProvider(MedicalRecordsService)
      .useValue(recordsService)
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

  it('GET /medical-records/:patientId returns record', async () => {
    recordsService.getMedicalRecord.mockResolvedValue({ record: { id: 'record-id' } });

    await request(app.getHttpServer())
      .get('/api/v1/medical-records/b7bfc4cc-7c99-4b7e-9f4e-1f0a3af1a111')
      .expect(200);
  });
});
