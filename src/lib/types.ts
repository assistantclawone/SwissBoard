import { Timestamp } from '@/firebase/local/firestore';
import type { LocalTimestamp } from '@/firebase/local/db';

// FieldValue-ersatz: ein lokaler serverTimestamp-Sentinel
// Represents a post/content item on a wall
export type Content = {
  // id is the document key, not a field. It's added by the hooks.
  wallId: string;
  authorId: string;
  type: 'text' | 'image' | 'link';
  data: string;
  position: { x: number; y: number };
  createdAt: Timestamp | LocalTimestamp; // Can be a server timestamp on creation
  updatedAt?: Timestamp | LocalTimestamp;
};

// Represents a wall
export type Wall = {
  // id is the document key, not a field. It's added by the hooks.
  ownerId: string;
  title: string;
  description?: string;
  createdAt: Timestamp | LocalTimestamp;
  privacySetting: 'public' | 'private';
  members?: { [key: string]: 'viewer' | 'editor' };
};
