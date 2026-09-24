import { describe, expect, it, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ApiClient } from '../api/api.client';
import { Beat } from '../api/api.types';
import { ApiError } from '../api/api.errors';
import { BeatsStore } from './beats.store';
import { PatternStore } from './pattern.store';
import { TransportStore } from './transport.store';
import { StorageService } from './storage.service';
import { installLocalStorageMock } from '../testing/local-storage-mock';

function page(items: Beat[], overrides: Record<string, unknown> = {}) {
  return {
    items,
    meta: {
      total: items.length,
      page: 1,
      limit: 20,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
      ...overrides,
    },
  };
}

function beat(overrides: Partial<Beat> = {}): Beat {
  return {
    id: '7',
    userId: '1',
    collectionId: null,
    title: 'Lo-fi',
    data: { version: 2 },
    createdAt: '2026-09-24T10:00:00.000Z',
    updatedAt: '2026-09-24T10:00:00.000Z',
    ...overrides,
  };
}

function setup() {
  installLocalStorageMock();

  const api = {
    createBeat: vi.fn().mockReturnValue(of(beat())),
    updateBeat: vi.fn().mockReturnValue(of(beat({ title: 'Renamed' }))),
    deleteBeat: vi.fn().mockReturnValue(of(undefined)),
    listBeats: vi.fn().mockReturnValue(of(page([beat()]))),
  };

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: ApiClient, useValue: api }] });

  const store = TestBed.inject(BeatsStore);
  const pattern = TestBed.inject(PatternStore);
  const transport = TestBed.inject(TransportStore);
  const storage = TestBed.inject(StorageService);

  /** A valid saved blob for the current grid, with overrides applied. */
  const savedBlob = (bpm: number) =>
    storage.toSavedState({ bpm, activeKit: pattern.activeKit(), tracks: pattern.tracks() });

  return { api, store, pattern, transport, savedBlob };
}

describe('BeatsStore', () => {
  let h: ReturnType<typeof setup>;

  beforeEach(() => {
    h = setup();
  });

  describe('saving', () => {
    it('creates on the first save and patches on the next', async () => {
      await h.store.save('Lo-fi');
      await h.store.save();

      // five clicks must not leave five near-identical beats
      expect(h.api.createBeat).toHaveBeenCalledOnce();
      expect(h.api.updateBeat).toHaveBeenCalledOnce();
      expect(h.api.updateBeat).toHaveBeenCalledWith('7', { data: expect.anything() });
    });

    it('sends the versioned blob the grid would auto-save', async () => {
      await h.store.save('Lo-fi');

      const body = h.api.createBeat.mock.calls[0][0];
      expect(body.title).toBe('Lo-fi');
      expect(body.data.version).toBe(2);
      expect(body.data.tracks).toHaveLength(8);
    });

    it('surfaces a failure without adopting a current beat', async () => {
      h.api.createBeat.mockReturnValue(throwError(() => ({ kind: 'offline' }) as ApiError));

      expect(await h.store.save('Lo-fi')).toBe(false);
      expect(h.store.status()).toBe('error');
      // a failed create must not look saved, or the next save would patch nothing
      expect(h.store.needsTitle()).toBe(true);
    });
  });

  describe('unsaved changes', () => {
    it('is clean on a fresh page', () => {
      expect(h.store.isDirty()).toBe(false);
    });

    it('notices an edit to the grid', () => {
      h.pattern.toggleStep(0, 0);

      expect(h.store.isDirty()).toBe(true);
    });

    it('notices a tempo change', () => {
      h.transport.setBpm(140);

      expect(h.store.isDirty()).toBe(true);
    });

    it('is clean again after saving', async () => {
      h.pattern.toggleStep(0, 0);
      await h.store.save('Lo-fi');

      expect(h.store.isDirty()).toBe(false);
    });

    it('is clean after reset, since starting over is deliberate', () => {
      h.pattern.toggleStep(0, 0);
      h.store.reset();

      expect(h.store.isDirty()).toBe(false);
    });
  });

  describe('loading', () => {
    it('puts the beat on the grid and adopts it', () => {
      const saved = h.savedBlob(96);
      saved.tracks[0].steps[3].on = true;

      expect(h.store.load(beat({ id: '9', data: saved }))).toBe(true);
      expect(h.transport.bpm()).toBe(96);
      expect(h.pattern.tracks()[0].steps[3].on).toBe(true);
      expect(h.store.currentBeat()?.id).toBe('9');
      // the loaded beat is now the current one, so the next save patches it
      expect(h.store.needsTitle()).toBe(false);
      expect(h.store.isDirty()).toBe(false);
    });

    it('refuses a blob it cannot read, leaving the grid alone', () => {
      const before = h.pattern.tracks();

      expect(h.store.load(beat({ data: { version: 99 } }))).toBe(false);
      expect(h.pattern.tracks()).toBe(before);
      expect(h.store.currentBeat()).toBeNull();
      expect(h.store.error()).toContain('could not be read');
    });
  });

  describe('the library', () => {
    it('fetches the first page', async () => {
      await h.store.refresh();

      expect(h.store.beats()).toHaveLength(1);
      expect(h.store.total()).toBe(1);
      expect(h.store.hasNext()).toBe(false);
    });

    it('reports a listing failure without throwing', async () => {
      h.api.listBeats.mockReturnValue(throwError(() => ({ kind: 'offline' }) as ApiError));

      await h.store.refresh();

      expect(h.store.listStatus()).toBe('error');
      expect(h.store.listError()).toContain('Cannot reach the server');
    });

    it('renames in the list and on the current beat', async () => {
      await h.store.save('Lo-fi');
      await h.store.refresh();

      expect(await h.store.rename('7', '  Renamed  ')).toBe(true);
      // trimmed, because the server requires 1-100 characters
      expect(h.api.updateBeat).toHaveBeenCalledWith('7', { title: 'Renamed' });
      expect(h.store.beats()[0].title).toBe('Renamed');
      expect(h.store.currentBeat()?.title).toBe('Renamed');
    });

    it('refuses a blank rename without calling the server', async () => {
      expect(await h.store.rename('7', '   ')).toBe(false);
      expect(h.api.updateBeat).not.toHaveBeenCalled();
    });

    it('appends the next page and remembers where it is', async () => {
      h.api.listBeats.mockReturnValueOnce(
        of(page([beat({ id: '1' })], { hasNext: true, total: 2 })),
      );
      await h.store.refresh();

      h.api.listBeats.mockReturnValueOnce(of(page([beat({ id: '2' })], { page: 2, total: 2 })));
      await h.store.loadMore();

      expect(h.api.listBeats).toHaveBeenLastCalledWith(2);
      expect(h.store.beats().map((b) => b.id)).toEqual(['1', '2']);
      expect(h.store.hasNext()).toBe(false);
    });

    it('does not repeat a row that offset pagination shifted onto both pages', async () => {
      h.api.listBeats.mockReturnValueOnce(
        of(page([beat({ id: '1' })], { hasNext: true, total: 2 })),
      );
      await h.store.refresh();

      // a beat saved between the two requests pushes row 1 onto page 2 as well
      h.api.listBeats.mockReturnValueOnce(
        of(page([beat({ id: '1' }), beat({ id: '2' })], { page: 2, total: 2 })),
      );
      await h.store.loadMore();

      expect(h.store.beats().map((b) => b.id)).toEqual(['1', '2']);
    });

    it('will not ask for more when there is no next page', async () => {
      await h.store.refresh();
      h.api.listBeats.mockClear();

      await h.store.loadMore();

      expect(h.api.listBeats).not.toHaveBeenCalled();
    });

    it('drops a deleted beat from the list', async () => {
      await h.store.refresh();

      expect(await h.store.remove('7')).toBe(true);
      expect(h.store.beats()).toHaveLength(0);
      expect(h.store.total()).toBe(0);
    });

    it('detaches the current beat when it is the one deleted', async () => {
      await h.store.save('Lo-fi');

      await h.store.remove('7');

      // the grid is untouched, but the next save must create rather than patch a dead row
      expect(h.store.currentBeat()).toBeNull();
      expect(h.store.needsTitle()).toBe(true);
    });
  });
});
