import { Controller, Get, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('health')
@Controller('health/search')
export class SearchHealthController {
  private readonly logger = new Logger(SearchHealthController.name);

  constructor(private readonly search: SearchService) {}

  @Get()
  @ApiOkResponse({
    description: 'The backend can reach Elasticsearch with its configured settings',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        version: { type: 'string', example: '8.15.3' },
      },
    },
  })
  @ApiServiceUnavailableResponse({ description: 'Elasticsearch is unreachable or rejected the request' })
  async check(): Promise<{ status: string; version: string }> {
    try {
      const { version } = await this.search.ping();
      return { status: 'ok', version };
    } catch (error) {
      // Details stay in the server log; clients only learn that search is unavailable.
      this.logger.warn(`Elasticsearch connectivity check failed: ${(error as Error).message}`);
      throw new ServiceUnavailableException('Search index is unavailable');
    }
  }
}
