# CLOUD.md — Doctor‑Care Africa

## FRONTEND (Next.js)
### Install dependencies
npm install

### Run development server
npm run dev

### Build for production
npm run build

### Start production server
npm start


## BACKEND (NestJS)
### Install dependencies
cd backend
npm install

### Run development server
npm run start:dev

### Build for production
npm run build

### Start production server
npm run start:prod


## DATABASE (Prisma + PostgreSQL)
### Run migrations
npx prisma migrate dev

### Generate Prisma client
npx prisma generate

### Reset database (development only)
npx prisma migrate reset


## TESTS
### Run backend tests
cd backend
npm run test

### Run backend e2e tests
npm run test:e2e

### Run frontend tests (if enabled)
npm run test
