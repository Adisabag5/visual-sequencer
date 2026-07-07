import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AudioEngine } from '../../../audio/audio-engine';
import { KitPanelStore } from '../../../state/kit-panel.store';
import { PatternStore } from '../../../state/pattern.store';
import { installLocalStorageMock } from '../../../testing/local-storage-mock';
import { KitPanel } from './kit-panel';

describe('KitPanel', () => {
  beforeEach(() => {
    installLocalStorageMock();
    TestBed.configureTestingModule({});
  });

  it('renders the 3 preset cards', async () => {
    const fixture = TestBed.createComponent(KitPanel);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const cards = el.querySelectorAll('.kit-card');
    expect(cards.length).toBe(3);
    expect(el.textContent).toContain('Musical 8');
    expect(el.textContent).toContain('Club / Techno');
    expect(el.textContent).toContain('Lo-fi / Organic');
  });

  it('shows the LOADED badge on the active kit and LOAD → on the rest', async () => {
    const fixture = TestBed.createComponent(KitPanel);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const cardText = (i: number): string => el.querySelectorAll('.kit-card')[i].textContent ?? '';
    // Fresh start: the default kit (Musical 8) is loaded.
    expect(cardText(0)).toContain('LOADED');
    expect(cardText(1)).toContain('LOAD →');

    TestBed.inject(PatternStore).loadKit('club');
    await fixture.whenStable();
    expect(cardText(0)).toContain('LOAD →');
    expect(cardText(1)).toContain('LOADED');
  });

  it('loads a kit when its card is clicked', async () => {
    const pattern = TestBed.inject(PatternStore);
    const loadKit = vi.spyOn(pattern, 'loadKit');
    const fixture = TestBed.createComponent(KitPanel);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    (el.querySelectorAll('.kit-card')[1] as HTMLButtonElement).click();
    expect(loadKit).toHaveBeenCalledWith('club');
  });

  it('renders 8 slot rows with grouped voice pickers in the custom view', async () => {
    TestBed.inject(KitPanelStore).setKitMode('custom');
    const fixture = TestBed.createComponent(KitPanel);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const pickers = el.querySelectorAll('select');
    expect(pickers.length).toBe(8);
    // Options are grouped by category and the current voice is selected.
    expect(pickers[0].querySelectorAll('optgroup').length).toBe(6);
    expect(pickers[0].querySelectorAll('option').length).toBe(30);
    expect(pickers[0].value).toBe('kick');
  });

  it('sets and auditions the voice when a picker changes', async () => {
    TestBed.inject(KitPanelStore).setKitMode('custom');
    const pattern = TestBed.inject(PatternStore);
    const engine = TestBed.inject(AudioEngine);
    const setVoice = vi.spyOn(pattern, 'setVoice');
    const unlock = vi.spyOn(engine, 'unlock').mockResolvedValue(undefined);
    const audition = vi.spyOn(engine, 'audition').mockImplementation(() => undefined);

    const fixture = TestBed.createComponent(KitPanel);
    await fixture.whenStable();
    const picker = (fixture.nativeElement as HTMLElement).querySelector('select');
    picker!.value = 'cowbell';
    picker!.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(setVoice).toHaveBeenCalledWith(0, 'cowbell');
    expect(unlock).toHaveBeenCalled();
    expect(audition).toHaveBeenCalledWith('cowbell', 0, expect.any(Number));
  });

  it('shows the KIT edge tab only while the panel is closed', async () => {
    const store = TestBed.inject(KitPanelStore);
    const fixture = TestBed.createComponent(KitPanel);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const tab = el.querySelector('.kit-tab') as HTMLButtonElement;
    const panel = el.querySelector('.kit-panel') as HTMLElement;
    expect(panel.classList).toContain('kit-panel-open');
    expect(tab.classList).toContain('kit-tab-hidden');

    store.closePanel();
    await fixture.whenStable();
    expect(panel.classList).not.toContain('kit-panel-open');
    expect(tab.classList).not.toContain('kit-tab-hidden');

    tab.click();
    await fixture.whenStable();
    expect(store.panelOpen()).toBe(true);
  });
});
