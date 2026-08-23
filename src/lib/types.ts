import { Timestamp } from '@/firebase/local/firestore';
import type { LocalTimestamp } from '@/firebase/local/db';

type TimestampLike = InstanceType<typeof Timestamp> | LocalTimestamp;

// FieldValue-ersatz: ein lokaler serverTimestamp-Sentinel
// Represents a post/content item on a wall
export type Content = {
  // id ist der Dokument-Schlüssel, kein Feld — wird von den Hooks ergänzt,
  // ist aber für lesende Komponenten (z.B. ContentCard) Teil des Typs.
  id: string;
  wallId: string;
  authorId: string;
  type: 'text' | 'image' | 'link';
  data: string;
  position: { x: number; y: number };
  createdAt: TimestampLike; // Can be a server timestamp on creation
  updatedAt?: TimestampLike;
};

// Represents a wall
export type Wall = {
  // id is the document key, not a field. It's added by the hooks.
  ownerId: string;
  title: string;
  description?: string;
  createdAt: TimestampLike;
  privacySetting: 'public' | 'private';
  members?: { [key: string]: 'viewer' | 'editor' };
};
