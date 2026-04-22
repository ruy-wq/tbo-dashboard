// Exponential backoff retry for flaky network / integration calls.
// Reusable across Notion, OMIE, Fireflies, RD, etc.

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  jitter?: boolean;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, nextDelayMs: number) => void;
}

export class RetryExhaustedError extends Error {
  readonly attempts: number;
  readonly lastError: unknown;
  constructor(attempts: number, lastError: unknown) {
    const msg = lastError instanceof Error ? lastError.message : String(lastError);
    super(`Retry exhausted after ${attempts} attempts: ${msg}`);
    this.name = "RetryExhaustedError";
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

const DEFAULTS: Required<Omit<RetryOptions, "shouldRetry" | "onRetry">> = {
  maxAttempts: 3,
  initialDelayMs: 500,
  maxDelayMs: 8_000,
  jitter: true,
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const opts = { ...DEFAULTS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const isLast = attempt === opts.maxAttempts;
      const shouldRetry = options.shouldRetry
        ? options.shouldRetry(error, attempt)
        : isRetryableByDefault(error);

      if (isLast || !shouldRetry) {
        throw isLast ? new RetryExhaustedError(attempt, error) : error;
      }

      const base = Math.min(
        opts.initialDelayMs * 2 ** (attempt - 1),
        opts.maxDelayMs,
      );
      const delay = opts.jitter ? base * (0.5 + Math.random() * 0.5) : base;
      options.onRetry?.(error, attempt, delay);
      await sleep(delay);
    }
  }

  throw new RetryExhaustedError(opts.maxAttempts, lastError);
}

/** Retry network errors and 5xx. Never retry 4xx (client error). */
function isRetryableByDefault(error: unknown): boolean {
  if (error instanceof HttpStatusError) {
    return error.status >= 500 && error.status < 600;
  }
  if (error instanceof TypeError) return true; // fetch network failure
  if (error instanceof Error && /network|timeout|ECONN|fetch failed/i.test(error.message)) {
    return true;
  }
  return false;
}

/** Throw this from `fn` to signal an HTTP status so retry logic can decide. */
export class HttpStatusError extends Error {
  readonly status: number;
  readonly body: unknown;
  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `HTTP ${status}`);
    this.name = "HttpStatusError";
    this.status = status;
    this.body = body;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
