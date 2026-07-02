import { TestBed } from '@angular/core/testing';
import { Grid } from './grid';

describe('Grid', () => {
  it('renders a row per track from the store', async () => {
    const fixture = TestBed.createComponent(Grid);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Kick');
    expect(el.textContent).toContain('Crash');
    expect(el.querySelectorAll('app-track-row').length).toBe(8);
  });
});
