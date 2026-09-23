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
