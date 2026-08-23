import { describe, expect, it } from 'vitest';
import { HttpErrorResponse } from '@angular/common/http';
import { toApiError } from './api.errors';

describe('toApiError', () => {
  it('maps a network failure to offline', () => {
    expect(toApiError(new HttpErrorResponse({ status: 0 }))).toEqual({
      kind: 'offline',
      detail: null,
    });
  });

  it('maps 401 and 409 without leaking a status code', () => {
    expect(toApiError(new HttpErrorResponse({ status: 401 })).kind).toBe('unauthorized');
    expect(toApiError(new HttpErrorResponse({ status: 409 })).kind).toBe('conflict');
  });

  it('carries the first validation message off a 400', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { message: ['password must be longer than or equal to 8 characters', 'x'] },
    });

    expect(toApiError(error)).toEqual({
      kind: 'invalid',
      detail: 'password must be longer than or equal to 8 characters',
    });
  });

  it('falls back to unknown for anything else', () => {
    expect(toApiError(new HttpErrorResponse({ status: 500 })).kind).toBe('unknown');
    expect(toApiError(new Error('boom')).kind).toBe('unknown');
  });
});
