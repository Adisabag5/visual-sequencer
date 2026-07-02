import { TestBed } from '@angular/core/testing';
import { TransportBar } from './transport-bar';

describe('TransportBar', () => {
  it('shows the current bpm', async () => {
    const fixture = TestBed.createComponent(TransportBar);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('118');
  });
});
