import { TestBed } from '@angular/core/testing';
import { createTrack } from '../../../core/kit';
import { VoiceId } from '../../../core/models';
import { VoicePicker } from './voice-picker';

describe('VoicePicker', () => {
  function render(voice: VoiceId = 'kick') {
    const fixture = TestBed.createComponent(VoicePicker);
    fixture.componentRef.setInput('track', createTrack(voice, 0.8));
    fixture.componentRef.setInput('trackNumber', 3);
    return fixture;
  }

  it('shows the voice name, track number, and the 6 category groups', async () => {
    const fixture = render();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Kick');
    expect(el.textContent).toContain('3');
    expect(el.querySelectorAll('optgroup').length).toBe(6);
    expect(el.querySelectorAll('option').length).toBe(30);
  });

  it('marks the current voice selected', async () => {
    const fixture = render('marimba');
    await fixture.whenStable();
    const select = (fixture.nativeElement as HTMLElement).querySelector('select')!;
    expect(select.value).toBe('marimba');
  });

  it('emits a validated voice id on change', async () => {
    const fixture = render();
    let emitted: VoiceId | undefined;
    fixture.componentInstance.voiceChange.subscribe((v) => (emitted = v));
    await fixture.whenStable();
    const select = (fixture.nativeElement as HTMLElement).querySelector('select')!;
    select.value = 'zap';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(emitted).toBe('zap');
  });
});
