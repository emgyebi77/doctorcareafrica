import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { AdminDashboardService } from '../src/modules/admin-dashboard/admin-dashboard.service';

describe('AdminDashboard (e2e)', () => {
  let app: INestApplication;
  const adminService = {
    listUsers: jest.fn(),
    analytics: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideProvider(AdminDashboardService)
      .useValue(adminService)
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

  it('GET /admin/users returns users', async () => {
    adminService.listUsers.mockResolvedValue({ users: [] });

    await request(app.getHttpServer())
      .get('/api/v1/admin/users')
      .expect(200);
  });

  it('GET /admin/analytics returns metrics', async () => {
    adminService.analytics.mockResolvedValue({ totals: {} });

    await request(app.getHttpServer())
      .get('/api/v1/admin/analytics')
      .expect(200);
  });
});
