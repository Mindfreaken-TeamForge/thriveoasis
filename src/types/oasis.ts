import { ThemeMode } from './theme';

export interface Oasis {
  id: string;
  ownerId: string;
  name: string;
  type: string;
  types?: string[];
  color: string;
  imageUrl?: string;
  theme: string;
  themeMode: ThemeMode;
  memberCount?: number;
  tier?: string;
  features?: string[];
  extraEmotes?: number;
  extraStickers?: number;
  monthlyPrice?: number;
}

export type OasisData = Omit<Oasis, 'id'>; 