import { TestBed } from '@angular/core/testing';
import { TransportBar } from './transport-bar';

describe('TransportBar', () => {
  it('shows the current bpm', async () => {
    const fixture = TestBed.createComponent(TransportBar);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('118');
  });

  it('emits kitToggle when the Kit button is pressed', async () => {
    const fixture = TestBed.createComponent(TransportBar);
    await fixture.whenStable();
    let emitted = 0;
    fixture.componentInstance.kitToggle.subscribe(() => emitted++);
    const kitBtn = (fixture.nativeElement as HTMLElement).querySelector(
      '.kit-btn',
    ) as HTMLButtonElement;
    kitBtn.click();
    expect(emitted).toBe(1);
  });
});
