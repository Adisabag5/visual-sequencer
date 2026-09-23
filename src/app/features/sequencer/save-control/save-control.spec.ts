import { describe, expect, it, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { SaveControl } from './save-control';
import { AuthStore } from '../../../state/auth.store';
import { BeatsStore } from '../../../state/beats.store';

function setup(options: { signedIn?: boolean; needsTitle?: boolean } = {}) {
  const { signedIn = true, needsTitle = true } = options;

  const beats = {
    status: signal<'idle' | 'saving' | 'saved' | 'error'>('idle'),
    error: signal<string | null>(null),
    total: signal<number | null>(null),
    isSaving: signal(false),
    needsTitle: signal(needsTitle),
    save: vi.fn().mockResolvedValue(true),
    acknowledge: vi.fn(),
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

  const fixture = TestBed.createComponent(SaveControl);
  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  const host = fixture.nativeElement as HTMLElement;

  return {
    beats,
    fixture,
    navigate,
    host,
    saveBtn: () => host.querySelector('.save-btn') as HTMLButtonElement,
    input: () => host.querySelector('.save-title-input') as HTMLInputElement,
    confirmBtn: () => host.querySelectorAll('.save-icon-btn')[0] as HTMLButtonElement,
    cancelBtn: () => host.querySelectorAll('.save-icon-btn')[1] as HTMLButtonElement,
  };
}

describe('SaveControl', () => {
  describe('signed out', () => {
    it('routes to the auth page rather than sitting there disabled', async () => {
      // a dead Save button as the signed-in indicator is the rejected idea
      const h = setup({ signedIn: false });
      await h.fixture.whenStable();

      expect(h.saveBtn().disabled).toBe(false);

      h.saveBtn().click();
      await h.fixture.whenStable();

      expect(h.navigate).toHaveBeenCalledWith(['/auth']);
      expect(h.beats.save).not.toHaveBeenCalled();
    });
  });

  describe('first save', () => {
    let h: ReturnType<typeof setup>;

    beforeEach(async () => {
      h = setup({ needsTitle: true });
      await h.fixture.whenStable();
      h.saveBtn().click();
      await h.fixture.whenStable();
    });

    it('asks for a title instead of saving straight away', () => {
      expect(h.input()).not.toBeNull();
      expect(h.beats.save).not.toHaveBeenCalled();
    });

    it('will not confirm an empty or whitespace title', async () => {
      expect(h.confirmBtn().disabled).toBe(true);

      h.fixture.componentInstance.onTitleInput('   ');
      await h.fixture.whenStable();

      // the server requires 1-100 characters, so whitespace is not a title
      expect(h.confirmBtn().disabled).toBe(true);
    });

    it('saves with the typed title once confirmed', async () => {
      h.fixture.componentInstance.onTitleInput('Lo-fi');
      await h.fixture.whenStable();

      h.confirmBtn().click();
      await h.fixture.whenStable();

      expect(h.beats.save).toHaveBeenCalledOnce();
      expect(h.beats.save.mock.calls[0][1]).toBe('Lo-fi');
      expect(h.input()).toBeNull();
    });

    it('sends the current bpm, kit and tracks', async () => {
      h.fixture.componentInstance.onTitleInput('Lo-fi');
      await h.fixture.whenStable();
      h.confirmBtn().click();
      await h.fixture.whenStable();

      const snapshot = h.beats.save.mock.calls[0][0];
      expect(snapshot.bpm).toBe(118);
      expect(snapshot.tracks).toHaveLength(8);
    });

    it('abandons the title on cancel', async () => {
      h.cancelBtn().click();
      await h.fixture.whenStable();

      expect(h.input()).toBeNull();
      expect(h.beats.save).not.toHaveBeenCalled();
      expect(h.saveBtn()).not.toBeNull();
    });
  });

  describe('later saves', () => {
    it('saves without asking for a title again', async () => {
      const h = setup({ needsTitle: false });
      await h.fixture.whenStable();

      h.saveBtn().click();
      await h.fixture.whenStable();

      expect(h.input()).toBeNull();
      expect(h.beats.save).toHaveBeenCalledOnce();
      expect(h.beats.save.mock.calls[0][1]).toBeUndefined();
    });

    it('ignores a click while a save is in flight', async () => {
      const h = setup({ needsTitle: false });
      h.beats.isSaving.set(true);
      await h.fixture.whenStable();

      expect(h.saveBtn().disabled).toBe(true);

      h.saveBtn().click();
      await h.fixture.whenStable();

      expect(h.beats.save).not.toHaveBeenCalled();
    });
  });

  describe('feedback', () => {
    it('confirms with the account total', async () => {
      const h = setup({ needsTitle: false });
      h.beats.status.set('saved');
      h.beats.total.set(3);
      await h.fixture.whenStable();

      expect(h.host.textContent).toContain('Saved');
      expect(h.host.textContent).toContain('3 beats');
    });

    it('shows the store error when a save fails', async () => {
      const h = setup({ needsTitle: false });
      h.beats.status.set('error');
      h.beats.error.set('Cannot reach the server. Is it running?');
      await h.fixture.whenStable();

      expect(h.host.querySelector('.save-note-error')?.textContent).toContain(
        'Cannot reach the server',
      );
    });
  });
});
