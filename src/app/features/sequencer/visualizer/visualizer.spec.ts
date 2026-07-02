import { TestBed } from '@angular/core/testing';
import { Visualizer } from './visualizer';

describe('Visualizer', () => {
  it('renders the placeholder label', async () => {
    const fixture = TestBed.createComponent(Visualizer);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Visualizer');
  });
});
