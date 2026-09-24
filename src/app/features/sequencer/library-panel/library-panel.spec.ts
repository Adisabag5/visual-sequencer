import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { LibraryPanel } from './library-panel';
import { AuthStore } from '../../../state/auth.store';
import { BeatsStore } from '../../../state/beats.store';
import { LibraryPanelStore } from '../../../state/library-panel.store';
import { Beat } from '../../../api/api.types';

function beat(overrides: Partial<Beat> = {}): Beat {
  return {
    id: '7',
    userId: '1',
    collectionId: null,
    title: 'Lo-fi',
    data: { version: 2 },
    createdAt: '2026-09-24T10:00:00.000Z',
    updatedAt: '2026-09-24T14:32:00.000Z',
    ...overrides,
  };
}

function setup(options: { signedIn?: boolean; dirty?: boolean; open?: boolean } = {}) {
  const { signedIn = true, dirty = false, open = true } = options;

  const beats = {
    beats: signal<readonly Beat[]>([beat(), beat({ id: '8', title: 'Club' })]),
    total: signal<number | null>(2),
    hasNext: signal(false),
    isListLoading: signal(false),
    listError: signal<string | null>(null),
    currentBeat: signal<Beat | null>(null),
    isDirty: signal(dirty),
    refresh: vi.fn().mockResolvedValue(undefined),
    loadMore: vi.fn().mockResolvedValue(undefined),
    load: vi.fn().mockReturnValue(true),
    rename: vi.fn().mockResolvedValue(true),
    remove: vi.fn().mockResolvedValue(true),
  };

  const auth = { isSignedIn: signal(signedIn) };

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: BeatsStore, useValue: beats },
      { provide: AuthStore, useValue: auth },
    ],
  });

  const panelStore = TestBed.inject(LibraryPanelStore);
  if (open) panelStore.openPanel();

  const fixture = TestBed.createComponent(LibraryPanel);
  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  const host = fixture.nativeElement as HTMLElement;

  return {
    beats,
    auth,
    fixture,
    host,
    navigate,
    rows: () => host.querySelectorAll('app-beat-row'),
    loadBtns: () => host.querySelectorAll('.beat-load'),
    text: () => host.textContent ?? '',
    action: (label: string) =>
      [...host.querySelectorAll('.lib-action')].find((b) =>
        (b.textContent ?? '').includes(label),
      ) as HTMLButtonElement,
  };
}

describe('LibraryPanel', () => {
  describe('signed out', () => {
    it('explains why there is no list, and offers to sign in', async () => {
      const h = setup({ signedIn: false });
      await h.fixture.whenStable();

      expect(h.rows()).toHaveLength(0);
      expect(h.beats.refresh).not.toHaveBeenCalled();

      h.action('Sign in').click();

      expect(h.navigate).toHaveBeenCalledWith(['/auth']);
    });
  });

  describe('opening', () => {
    it('fetches the list when the panel opens', async () => {
      const h = setup({ open: true });
      await h.fixture.whenStable();

      // fetched on open, not at boot: a beat saved on another device should
      // appear when you go looking, not only after a reload
      expect(h.beats.refresh).toHaveBeenCalled();
    });

    it('does not fetch while the panel is closed', async () => {
      const h = setup({ open: false });
      await h.fixture.whenStable();

      expect(h.beats.refresh).not.toHaveBeenCalled();
    });

    it('lists the saved beats', async () => {
      const h = setup();
      await h.fixture.whenStable();

      expect(h.rows()).toHaveLength(2);
      expect(h.text()).toContain('Lo-fi');
      expect(h.text()).toContain('Club');
    });
  });

  describe('loading a beat', () => {
    it('loads straight away when there is nothing to lose', async () => {
      const h = setup({ dirty: false });
      await h.fixture.whenStable();

      (h.loadBtns()[0] as HTMLButtonElement).click();
      await h.fixture.whenStable();

      expect(h.beats.load).toHaveBeenCalledOnce();
      expect(h.beats.load.mock.calls[0][0].id).toBe('7');
    });

    it('asks first when the grid has unsaved changes', async () => {
      const h = setup({ dirty: true });
      await h.fixture.whenStable();

      (h.loadBtns()[0] as HTMLButtonElement).click();
      await h.fixture.whenStable();

      expect(h.beats.load).not.toHaveBeenCalled();
      expect(h.text()).toContain('unsaved changes');
    });

    it('loads the beat that was asked about once confirmed', async () => {
      const h = setup({ dirty: true });
      await h.fixture.whenStable();

      (h.loadBtns()[1] as HTMLButtonElement).click();
      await h.fixture.whenStable();
      h.action('Load anyway').click();
      await h.fixture.whenStable();

      expect(h.beats.load).toHaveBeenCalledOnce();
      expect(h.beats.load.mock.calls[0][0].id).toBe('8');
    });

    it('discards nothing on cancel', async () => {
      const h = setup({ dirty: true });
      await h.fixture.whenStable();

      (h.loadBtns()[0] as HTMLButtonElement).click();
      await h.fixture.whenStable();
      h.action('Cancel').click();
      await h.fixture.whenStable();

      expect(h.beats.load).not.toHaveBeenCalled();
      expect(h.rows()).toHaveLength(2);
    });
  });

  describe('deleting', () => {
    it('always confirms, since there is no undo', async () => {
      const h = setup();
      await h.fixture.whenStable();

      h.fixture.componentInstance['onRemove'](beat());
      await h.fixture.whenStable();

      expect(h.beats.remove).not.toHaveBeenCalled();
      expect(h.text()).toContain('cannot be undone');

      h.action('Delete').click();
      await h.fixture.whenStable();

      expect(h.beats.remove).toHaveBeenCalledWith('7');
    });
  });
});
