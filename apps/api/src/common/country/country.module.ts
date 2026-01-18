import { Global, Module } from '@nestjs/common';

import { CountryService } from './country.service';

@Global()
@Module({
  providers: [CountryService],
  exports: [CountryService],
})
export class CountryModule {}
