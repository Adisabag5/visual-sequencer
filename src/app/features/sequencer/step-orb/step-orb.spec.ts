import { TestBed } from '@angular/core/testing';
import { StepOrb } from './step-orb';

describe('StepOrb', () => {
  function render(step: { on: boolean; pitch: number }, extra: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(StepOrb);
    fixture.componentRef.setInput('step', step);
    for (const [k, v] of Object.entries(extra)) fixture.componentRef.setInput(k, v);
    return fixture;
  }

  it('renders an on step as a colored gradient', async () => {
    const fixture = render({ on: true, pitch: 0 }, { main: '#9E86E8', light: '#C7B8F5' });
    await fixture.whenStable();
    const orb = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    expect(orb.style.background).toContain('radial-gradient');
  });

  it('renders an off step with the cell-off shadow', async () => {
    const fixture = render({ on: false, pitch: 0 });
    await fixture.whenStable();
    const orb = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    expect(orb.style.boxShadow).toContain('--shadow-cell-off');
    expect(orb.style.transform).toBe('none');
  });

  it('pops (scales) on a hit', async () => {
    const fixture = render({ on: true, pitch: 0 }, { current: true });
    await fixture.whenStable();
    const orb = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    expect(orb.style.transform).toContain('scale(1.22)');
  });

  it('shows a rotated pitch notch for a tweaked on-step', async () => {
    const fixture = render({ on: true, pitch: 6 });
    await fixture.whenStable();
    const notch = (fixture.nativeElement as HTMLElement).querySelector('span[style*="rotate"]');
    expect(notch).not.toBeNull();
  });

  it('shows no notch at pitch 0', async () => {
    const fixture = render({ on: true, pitch: 0 });
    await fixture.whenStable();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('span[style*="rotate"]'),
    ).toBeNull();
  });

  it('scroll up raises the pitch', async () => {
    const fixture = render({ on: true, pitch: 0 });
    let emitted: number | undefined;
    fixture.componentInstance.pitchChange.subscribe((v) => (emitted = v));
    await fixture.whenStable();
    const btn = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    btn.dispatchEvent(new WheelEvent('wheel', { deltaY: -1, bubbles: true, cancelable: true }));
    expect(emitted).toBe(1);
  });

  it('right-click resets pitch to 0', async () => {
    const fixture = render({ on: true, pitch: 5 });
    let emitted: number | undefined;
    fixture.componentInstance.pitchChange.subscribe((v) => (emitted = v));
    await fixture.whenStable();
    const btn = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    btn.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    expect(emitted).toBe(0);
  });
});
