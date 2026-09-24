import { describe, expect, it, beforeEach } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { BeatRow } from './beat-row';
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

function setup(active = false) {
  TestBed.resetTestingModule();
  const fixture: ComponentFixture<BeatRow> = TestBed.createComponent(BeatRow);
  fixture.componentRef.setInput('beat', beat());
  fixture.componentRef.setInput('active', active);

  const host = fixture.nativeElement as HTMLElement;

  return {
    fixture,
    host,
    row: fixture.componentInstance,
    loadBtn: () => host.querySelector('.beat-load') as HTMLButtonElement,
    renameBtn: () => host.querySelectorAll('.beat-icon-btn')[0] as HTMLButtonElement,
    deleteBtn: () => host.querySelectorAll('.beat-icon-btn')[1] as HTMLButtonElement,
    input: () => host.querySelector('.beat-rename-input') as HTMLInputElement,
  };
}

describe('BeatRow', () => {
  let h: ReturnType<typeof setup>;

  beforeEach(async () => {
    h = setup();
    await h.fixture.whenStable();
  });

  it('shows the title and when it was last updated', () => {
    // DatePipe renders in the machine's timezone, so the expectation is derived
    // the same way rather than hardcoded — otherwise this passes here and fails
    // in CI on a different offset.
    const updated = new Date('2026-09-24T14:32:00.000Z');
    const localTime = `${String(updated.getHours()).padStart(2, '0')}:${String(
      updated.getMinutes(),
    ).padStart(2, '0')}`;

    expect(h.host.textContent).toContain('Lo-fi');
    expect(h.host.textContent).toContain(localTime);
  });

  it('marks the beat that is on the grid', async () => {
    const active = setup(true);
    await active.fixture.whenStable();

    expect(active.host.querySelector('.beat-row-active')).not.toBeNull();
    expect(active.host.textContent).toContain('on the grid');
  });

  it('emits load', () => {
    let loaded = 0;
    h.row.loadBeat.subscribe(() => loaded++);

    h.loadBtn().click();

    expect(loaded).toBe(1);
  });

  it('emits remove', () => {
    let removed = 0;
    h.row.remove.subscribe(() => removed++);

    h.deleteBtn().click();

    expect(removed).toBe(1);
  });

  describe('renaming', () => {
    beforeEach(async () => {
      h.renameBtn().click();
      await h.fixture.whenStable();
    });

    it('starts from the existing title, so a small edit is a small edit', () => {
      expect(h.input().value).toBe('Lo-fi');
    });

    it('emits the trimmed title on confirm', async () => {
      const titles: string[] = [];
      h.row.rename.subscribe((title) => titles.push(title));

      h.row.onDraftInput('  Renamed  ');
      await h.fixture.whenStable();
      h.row.confirmRename();

      expect(titles).toEqual(['Renamed']);
    });

    it('will not confirm a blank title', async () => {
      let emitted = 0;
      h.row.rename.subscribe(() => emitted++);

      h.row.onDraftInput('   ');
      await h.fixture.whenStable();
      h.row.confirmRename();

      // the server requires 1-100 characters
      expect(emitted).toBe(0);
    });

    it('emits nothing on cancel', async () => {
      let emitted = 0;
      h.row.rename.subscribe(() => emitted++);

      h.row.onDraftInput('Renamed');
      h.row.cancelRename();
      await h.fixture.whenStable();

      expect(emitted).toBe(0);
      expect(h.input()).toBeNull();
    });
  });
});
