import { Routes } from '@angular/router';
import { redirectIfSignedIn } from './state/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [redirectIfSignedIn],
    loadComponent: () => import('./features/auth/auth-page/auth-page').then((m) => m.AuthPage),
    title: 'Sign in · Pulse',
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/sequencer/sequencer-page/sequencer-page').then((m) => m.SequencerPage),
    title: 'Pulse',
  },
  { path: '**', redirectTo: '' },
];
