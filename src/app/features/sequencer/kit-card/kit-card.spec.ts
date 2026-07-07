import { TestBed } from '@angular/core/testing';
import { KITS } from '../../../core/kits';
import { KitCard } from './kit-card';

describe('KitCard', () => {
  function render(active = false) {
    const fixture = TestBed.createComponent(KitCard);
    fixture.componentRef.setInput('kit', KITS[0]);
    fixture.componentRef.setInput('active', active);
    return fixture;
  }

  it('renders the kit name, description, and 8 voice chips', async () => {
    const fixture = render();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Musical 8');
    expect(el.textContent).toContain(KITS[0].desc);
    expect(el.querySelectorAll('.chip').length).toBe(8);
  });

  it('shows LOADED when active, LOAD → otherwise', async () => {
    const active = render(true);
    await active.whenStable();
    expect((active.nativeElement as HTMLElement).textContent).toContain('LOADED');

    const idle = render(false);
    await idle.whenStable();
    expect((idle.nativeElement as HTMLElement).textContent).toContain('LOAD →');
  });

  it('emits load on click', async () => {
    const fixture = render();
    let loaded = false;
    fixture.componentInstance.loadKit.subscribe(() => (loaded = true));
    await fixture.whenStable();
    (fixture.nativeElement as HTMLElement).querySelector('button')!.click();
    expect(loaded).toBe(true);
  });
});
