import { Module } from '@nestjs/common';
import { SearchHealthController } from './search-health.controller';
import { SearchService } from './search.service';

@Module({
  controllers: [SearchHealthController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
