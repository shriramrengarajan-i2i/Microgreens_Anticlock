export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

/** Exponential backoff with full jitter: random delay in [0, min(max, base * 2^attempt)). */
export function backoffDelayMs(
  attempt: number,
  opts: RetryOptions,
  random: () => number = Math.random,
): number {
  const ceiling = Math.min(opts.maxDelayMs, opts.baseDelayMs * 2 ** attempt);
  return Math.floor(random() * ceiling);
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function withRetry<T>(
  operation: () => Promise<T>,
  opts: RetryOptions,
  shouldRetry: (error: unknown) => boolean,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt + 1 >= opts.maxAttempts || !shouldRetry(error)) {
        throw error;
      }
      await sleep(backoffDelayMs(attempt, opts));
    }
  }
}
