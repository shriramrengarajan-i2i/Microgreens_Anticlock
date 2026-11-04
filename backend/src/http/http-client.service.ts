import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { withRetry } from './retry';

class RetryableStatusError extends Error {
  constructor(readonly response: Response) {
    super(`Retryable HTTP status ${response.status}`);
  }
}

const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

/** Default outbound HTTP client: retries network errors and transient statuses with backoff and jitter. */
@Injectable()
export class HttpClientService {
  constructor(private readonly config: AppConfigService) {}

  async fetch(input: string | URL, init?: RequestInit): Promise<Response> {
    try {
      return await withRetry(
        async () => {
          const response = await fetch(input, init);
          if (RETRYABLE_STATUSES.has(response.status)) {
            throw new RetryableStatusError(response);
          }
          return response;
        },
        this.config.retry,
        () => true,
      );
    } catch (error) {
      // After the final attempt, hand the last transient response back to the caller.
      if (error instanceof RetryableStatusError) {
        return error.response;
      }
      throw error;
    }
  }
}
