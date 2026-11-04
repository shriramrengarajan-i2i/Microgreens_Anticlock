import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Server-side configuration. Secrets are read from the environment and never returned to clients. */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  get aiProviderApiKey(): string | undefined {
    return this.config.get<string>('AI_PROVIDER_API_KEY') || undefined;
  }

  get retry(): { maxAttempts: number; baseDelayMs: number; maxDelayMs: number } {
    return {
      maxAttempts: this.positiveInt('HTTP_RETRY_MAX_ATTEMPTS', 4),
      baseDelayMs: this.positiveInt('HTTP_RETRY_BASE_DELAY_MS', 200),
      maxDelayMs: this.positiveInt('HTTP_RETRY_MAX_DELAY_MS', 5000),
    };
  }

  private positiveInt(key: string, fallback: number): number {
    const value = Number(this.config.get<string>(key));
    return Number.isInteger(value) && value > 0 ? value : fallback;
  }
}
