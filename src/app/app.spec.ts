import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';
import { API_BASE_URL } from './api/api.config';

const BASE = 'http://api.test';

describe('App', () => {
  let backend: HttpTestingController;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    }).compileComponents();

    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);

    expect(fixture.componentInstance).toBeTruthy();
    backend.expectOne(`${BASE}/auth/refresh`).flush(null, { status: 401, statusText: '' });
  });

  it('hosts the router outlet rather than a fixed page', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
    backend.expectOne(`${BASE}/auth/refresh`).flush(null, { status: 401, statusText: '' });
  });

  it('asks the server to restore a session on boot', () => {
    TestBed.createComponent(App);

    // the access token never survives a reload; the refresh cookie does, so the
    // app must ask rather than read anything back from storage
    const request = backend.expectOne(`${BASE}/auth/refresh`);
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    request.flush(null, { status: 401, statusText: '' });
  });
});
