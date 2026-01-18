import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { AiService } from '../src/modules/ai/ai.service';

describe('AI (e2e)', () => {
  let app: INestApplication;
  const aiService = {
    triage: jest.fn(),
    symptomGuidance: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideProvider(AiService)
      .useValue(aiService)
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

  it('POST /ai/triage returns response', async () => {
    aiService.triage.mockResolvedValue({ response: 'ok', logId: 'log-id' });

    await request(app.getHttpServer())
      .post('/api/v1/ai/triage')
      .send({ symptoms: 'Headache for two days.' })
      .expect(200);
  });

  it('POST /ai/symptom-guidance returns response', async () => {
    aiService.symptomGuidance.mockResolvedValue({ response: 'ok', logId: 'log-id' });

    await request(app.getHttpServer())
      .post('/api/v1/ai/symptom-guidance')
      .send({ symptoms: 'Mild headache', duration: '1 day' })
      .expect(200);
  });
});
