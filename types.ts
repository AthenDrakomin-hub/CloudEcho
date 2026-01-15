
export interface Song {
  id: string;
  name: string;
  artist: string;
  url: string;
  coverUrl: string;
  size?: number;
  lastModified?: Date;
  lyrics?: string;
  tags?: string[];
  isExternal?: boolean; 
}

export interface Video {
  id: string;
  name: string;
  artist: string;
  url: string;
  coverUrl: string;
  lastModified?: Date;
}

export interface Playlist {
  id: string;
  name: string;
  songIds: string[];
  createdAt: number;
}

export enum PlaybackMode {
  SEQUENCE = 'SEQUENCE',
  SHUFFLE = 'SHUFFLE',
  REPEAT_ONE = 'REPEAT_ONE'
}

export enum ViewMode {
  PLAYER = 'PLAYER',
  DISCOVERY = 'DISCOVERY',
  MANAGER = 'MANAGER',
  VIDEO = 'VIDEO',
  SONG_DETAILS = 'SONG_DETAILS',
  VIDEO_DETAILS = 'VIDEO_DETAILS',
  SETTINGS = 'SETTINGS',
  PLAYLIST_DETAIL = 'PLAYLIST_DETAIL',
  COPYWRITING = 'COPYWRITING'
}

export type NotificationType = 'error' | 'warning' | 'info' | 'success';

export interface AppNotification {
  id: string;
  message: string;
  type: NotificationType;
}

export interface Quote {
  id: string;
  category: string;
  content: string;
  createdAt: number;
}
