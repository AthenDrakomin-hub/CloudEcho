
export interface Song {
  id: string;
  name: string;
  artist: string;
  url: string;
  coverUrl: string;
  size?: number;
  lastModified?: Date;
  lyrics?: string;
  tags?: string[]; // 新增：标签系统
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
  API_DOCS = 'API_DOCS',
  SONG_DETAILS = 'SONG_DETAILS',
  VIDEO_DETAILS = 'VIDEO_DETAILS',
  SETTINGS = 'SETTINGS',
  CACHE_SPACE = 'CACHE_SPACE'
}

export type NotificationType = 'error' | 'warning' | 'info' | 'success';

export interface AppNotification {
  id: string;
  message: string;
  type: NotificationType;
}

export interface Quote {
  id: number;
  category: string;
  content: string;
}
