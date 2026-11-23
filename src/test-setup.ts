import { beforeEach } from 'vitest';
import { installLocalStorageMock } from './app/testing/local-storage-mock';

/**
 * Every test starts with an empty localStorage.
 *
 * Vitest shares one jsdom per worker, so without this a spec that writes
 * `pulse.state` leaves it there for whatever runs next in that worker — and
 * PatternStore and TransportStore both read it in their constructors. The
 * symptom is a component spec failing on a value it never set, only sometimes,
 * depending on which file happened to run first. CI found exactly that:
 * transport-bar expecting 118 bpm and getting the 140 that storage.service's
 * spec had written.
 *
 * Specs that care about storage still install their own mock; this is the
 * floor, not a replacement.
 */
beforeEach(() => {
  installLocalStorageMock();
});
