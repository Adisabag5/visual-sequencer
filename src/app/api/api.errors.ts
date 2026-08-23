import { HttpErrorResponse } from '@angular/common/http';

/**
 * What went wrong, in terms the rest of the app can reason about. Status codes
 * stop here: the State layer must not know what a 409 is.
 */
export type ApiErrorKind = 'offline' | 'unauthorized' | 'conflict' | 'invalid' | 'unknown';

export interface ApiError {
  kind: ApiErrorKind;
  /** The server's own explanation, when it gave one worth showing. */
  detail: string | null;
}

export function toApiError(error: unknown): ApiError {
  if (!(error instanceof HttpErrorResponse)) return { kind: 'unknown', detail: null };

  const body = error.error as { message?: string | string[] } | null;

  switch (error.status) {
    case 0:
      return { kind: 'offline', detail: null };
    case 401:
      return { kind: 'unauthorized', detail: null };
    case 409:
      return { kind: 'conflict', detail: null };
    case 400:
      return { kind: 'invalid', detail: firstMessage(body?.message) };
    default:
      return { kind: 'unknown', detail: null };
  }
}

/** class-validator returns an array of messages; the first is the useful one. */
function firstMessage(message: string | string[] | undefined): string | null {
  if (Array.isArray(message)) return message[0] ?? null;

  return message ?? null;
}
