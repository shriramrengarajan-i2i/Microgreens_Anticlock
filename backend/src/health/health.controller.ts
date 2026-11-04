import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({
    description: 'Service is running',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        uptimeSeconds: { type: 'number', example: 12.3 },
      },
    },
  })
  check(): { status: string; uptimeSeconds: number } {
    return { status: 'ok', uptimeSeconds: process.uptime() };
  }
}
