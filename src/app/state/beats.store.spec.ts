import { describe, expect, it, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ApiClient } from '../api/api.client';
import { Beat } from '../api/api.types';
import { ApiError } from '../api/api.errors';
import { BeatsStore } from './beats.store';
import { PersistedSnapshot } from './storage.service';
import { createTrack } from '../core/kit';

function snapshot(): PersistedSnapshot {
  return { bpm: 118, activeKit: 'musical8', tracks: [createTrack('kick', 0.9)] };
}

function beat(overrides: Partial<Beat> = {}): Beat {
  return {
    id: '7',
    userId: '1',
    collectionId: null,
    title: 'Lo-fi',
    data: { version: 2 },
    createdAt: '2026-09-23T10:00:00.000Z',
    updatedAt: '2026-09-23T10:00:00.000Z',
    ...overrides,
  };
}

function setup() {
  const api = {
    createBeat: vi.fn().mockReturnValue(of(beat())),
    updateBeat: vi.fn().mockReturnValue(of(beat({ updatedAt: '2026-09-23T11:00:00.000Z' }))),
    listBeats: vi.fn().mockReturnValue(of({ items: [beat()], meta: { total: 3 } })),
  };

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: ApiClient, useValue: api }] });

  return { api, store: TestBed.inject(BeatsStore) };
}

describe('BeatsStore', () => {
  let harness: ReturnType<typeof setup>;

  beforeEach(() => {
    harness = setup();
  });

  it('asks for a title only before the first save', async () => {
    expect(harness.store.needsTitle()).toBe(true);

    await harness.store.save(snapshot(), 'Lo-fi');

    expect(harness.store.needsTitle()).toBe(false);
  });

  it('creates on the first save and patches on the next', async () => {
    await harness.store.save(snapshot(), 'Lo-fi');
    await harness.store.save(snapshot());

    // the whole point: five clicks must not leave five near-identical beats
    expect(harness.api.createBeat).toHaveBeenCalledOnce();
    expect(harness.api.updateBeat).toHaveBeenCalledOnce();
    expect(harness.api.updateBeat).toHaveBeenCalledWith('7', { data: expect.anything() });
  });

  it('sends the versioned SavedState blob as data', async () => {
    await harness.store.save(snapshot(), 'Lo-fi');

    const body = harness.api.createBeat.mock.calls[0][0];
    expect(body.title).toBe('Lo-fi');
    expect(body.data.version).toBe(2);
    expect(body.data.bpm).toBe(118);
    expect(body.data.tracks).toHaveLength(1);
  });

  it('trims the title, since the server requires at least one character', async () => {
    await harness.store.save(snapshot(), '  Lo-fi  ');

    expect(harness.api.createBeat.mock.calls[0][0].title).toBe('Lo-fi');
  });

  it('creates a new beat again after a reset', async () => {
    await harness.store.save(snapshot(), 'Lo-fi');
    harness.store.reset();

    expect(harness.store.needsTitle()).toBe(true);

    await harness.store.save(snapshot(), 'Second');

    expect(harness.api.createBeat).toHaveBeenCalledTimes(2);
  });

  it('reports the account total after a save', async () => {
    await harness.store.save(snapshot(), 'Lo-fi');

    expect(harness.store.total()).toBe(3);
  });

  it('keeps the save successful when the list call fails', async () => {
    harness.api.listBeats.mockReturnValue(throwError(() => ({ kind: 'offline' }) as ApiError));

    const ok = await harness.store.save(snapshot(), 'Lo-fi');

    expect(ok).toBe(true);
    expect(harness.store.status()).toBe('saved');
    expect(harness.store.total()).toBeNull();
  });

  it('surfaces a failure without adopting a current beat', async () => {
    harness.api.createBeat.mockReturnValue(throwError(() => ({ kind: 'offline' }) as ApiError));

    const ok = await harness.store.save(snapshot(), 'Lo-fi');

    expect(ok).toBe(false);
    expect(harness.store.status()).toBe('error');
    expect(harness.store.error()).toContain('Cannot reach the server');
    // a failed create must not look like a saved beat, or the next save would PATCH nothing
    expect(harness.store.needsTitle()).toBe(true);
  });
});
