import { TestBed } from '@angular/core/testing';
import { UiButton } from './ui-button';

describe('UiButton', () => {
  it('emits press on click', async () => {
    const fixture = TestBed.createComponent(UiButton);
    let pressed = false;
    fixture.componentRef.instance.press.subscribe(() => (pressed = true));
    await fixture.whenStable();
    (fixture.nativeElement as HTMLElement).querySelector('button')!.click();
    expect(pressed).toBe(true);
  });
});
