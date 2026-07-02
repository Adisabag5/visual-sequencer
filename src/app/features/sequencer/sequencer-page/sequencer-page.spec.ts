import { TestBed } from '@angular/core/testing';
import { SequencerPage } from './sequencer-page';

describe('SequencerPage', () => {
  it('renders the Pulse header', async () => {
    const fixture = TestBed.createComponent(SequencerPage);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Pulse');
  });

  it('composes transport, grid and visualizer', async () => {
    const fixture = TestBed.createComponent(SequencerPage);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-transport-bar')).not.toBeNull();
    expect(el.querySelector('app-grid')).not.toBeNull();
    expect(el.querySelector('app-visualizer')).not.toBeNull();
  });
});
