import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthStore } from './state/auth.store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly auth = inject(AuthStore);

  constructor() {
    // The access token is gone after a reload; the httpOnly refresh cookie is
    // not. Asking the server once at boot is what makes a session survive.
    void this.auth.restore();
  }
}
