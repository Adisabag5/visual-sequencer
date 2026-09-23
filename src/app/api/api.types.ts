/** Wire shapes returned by nest-server. Dates arrive as ISO strings, not Date. */

export type Role = 'ADMIN' | 'USER';

/** A registered person. The server calls this `user`; the glossary calls it Account. */
export interface Account {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  access_token: string;
  user: Account;
}

export interface Profile {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * A beat's pattern payload, as the server sees it: it validates `version` and
 * the payload size, and stores the rest opaquely. Everything else travels along
 * at runtime but is deliberately not described here — the real shape is
 * `SavedState`, which lives in the State layer, and api/ sits below state/, so
 * naming it here would invert the layering. Coming back, the State layer hands
 * the blob to StorageService, which validates it like any untrusted input.
 */
export interface BeatData {
  version: number;
}

/** A pattern saved under a title and owned by an account. */
export interface Beat {
  id: string;
  userId: string;
  collectionId: string | null;
  title: string;
  data: BeatData;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBeatBody {
  title: string;
  data: BeatData;
  collectionId?: string;
}

/** PATCH is partial: saving an existing beat sends `data` and nothing else. */
export type UpdateBeatBody = Partial<CreateBeatBody>;

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Every list endpoint returns this, never a bare array. */
export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

export interface Credentials {
  email: string;
  password: string;
}
