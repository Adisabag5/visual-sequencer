import { TestBed } from '@angular/core/testing';
import { StepOrb } from './step-orb';

describe('StepOrb', () => {
  function render(step: { on: boolean; pitch: number }, extra: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(StepOrb);
    fixture.componentRef.setInput('step', step);
    for (const [k, v] of Object.entries(extra)) fixture.componentRef.setInput(k, v);
    return fixture;
  }

  function orbEl(fixture: ReturnType<typeof render>): HTMLButtonElement {
    return (fixture.nativeElement as HTMLElement).querySelector('button')!;
  }

  it('renders an on step with the on state class', async () => {
    const fixture = render({ on: true, pitch: 0 });
    await fixture.whenStable();
    const orb = orbEl(fixture);
    expect(orb.classList.contains('on')).toBe(true);
    expect(orb.classList.contains('hit')).toBe(false);
  });

  it('renders an off step with no state classes', async () => {
    const fixture = render({ on: false, pitch: 0 });
    await fixture.whenStable();
    const orb = orbEl(fixture);
    expect(orb.classList.contains('on')).toBe(false);
    expect(orb.classList.contains('hit')).toBe(false);
    expect(orb.classList.contains('playhead')).toBe(false);
  });

  it('marks the hit state when current while on', async () => {
    const fixture = render({ on: true, pitch: 0 }, { current: true });
    await fixture.whenStable();
    expect(orbEl(fixture).classList.contains('hit')).toBe(true);
  });

  it('marks the playhead state when current while off', async () => {
    const fixture = render({ on: false, pitch: 0 }, { current: true });
    await fixture.whenStable();
    expect(orbEl(fixture).classList.contains('playhead')).toBe(true);
  });

  it('shows the pitch notch, rotated via --notch-deg, for a tweaked on-step', async () => {
    const fixture = render({ on: true, pitch: 6 });
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.orb-notch')).not.toBeNull();
    expect(host.style.getPropertyValue('--notch-deg')).toBe('67.5deg');
  });

  it('shows no notch at pitch 0', async () => {
    const fixture = render({ on: true, pitch: 0 });
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('.orb-notch')).toBeNull();
  });

  it('scroll up raises the pitch', async () => {
    const fixture = render({ on: true, pitch: 0 });
    let emitted: number | undefined;
    fixture.componentInstance.pitchChange.subscribe((v) => (emitted = v));
    await fixture.whenStable();
    const btn = orbEl(fixture);
    btn.dispatchEvent(new WheelEvent('wheel', { deltaY: -1, bubbles: true, cancelable: true }));
    expect(emitted).toBe(1);
  });

  it('right-click resets pitch to 0', async () => {
    const fixture = render({ on: true, pitch: 5 });
    let emitted: number | undefined;
    fixture.componentInstance.pitchChange.subscribe((v) => (emitted = v));
    await fixture.whenStable();
    const btn = orbEl(fixture);
    btn.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    expect(emitted).toBe(0);
  });
});
