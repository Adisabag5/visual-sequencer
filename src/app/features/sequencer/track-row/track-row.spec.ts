import { TestBed } from '@angular/core/testing';
import { TrackRow } from './track-row';
import { createKit } from '../../../core/kit';

describe('TrackRow', () => {
  it('renders the track name and 16 steps', async () => {
    const fixture = TestBed.createComponent(TrackRow);
    fixture.componentRef.setInput('track', createKit()[0]);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Kick');
    expect(el.querySelectorAll('.aspect-square').length).toBe(16);
  });

  it('emits muteToggle when the mute swatch is clicked', async () => {
    const fixture = TestBed.createComponent(TrackRow);
    fixture.componentRef.setInput('track', createKit()[0]);
    let muted = false;
    fixture.componentInstance.muteToggle.subscribe(() => (muted = true));
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    (el.querySelector('button[aria-label="Mute track"]') as HTMLButtonElement).click();
    expect(muted).toBe(true);
  });

  it('emits soloToggle when the solo swatch is clicked', async () => {
    const fixture = TestBed.createComponent(TrackRow);
    fixture.componentRef.setInput('track', createKit()[0]);
    let soloed = false;
    fixture.componentInstance.soloToggle.subscribe(() => (soloed = true));
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    (el.querySelector('button[aria-label="Solo track"]') as HTMLButtonElement).click();
    expect(soloed).toBe(true);
  });

  it('dims a non-soloed track when another is soloed', async () => {
    const fixture = TestBed.createComponent(TrackRow);
    fixture.componentRef.setInput('track', createKit()[0]); // not soloed
    fixture.componentRef.setInput('anySoloed', true);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.opacity-45')).not.toBeNull();
  });
});
