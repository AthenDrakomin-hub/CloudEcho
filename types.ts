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
  title: string;
  url: string;
  thumbnailUrl: string;
  duration?: number;
  size?: number;
  lastModified?: Date;
}

export interface NewsItem {
  tag: string;
  headline: string;
  timestamp: string;
  source: string;
  isUrgent?: boolean;
}

export interface CloudFile {
  key: string;
  url: string;
  size: number;
  type: 'audio' | 'video' | 'image' | 'document';
  lastModified: Date;
}

export interface SystemStats {
  cpu: number;
  memory: string;
  latency: string;
  uptime: string;
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
  CACHE_SPACE = 'CACHE_SPACE',
  DASHBOARD = 'DASHBOARD',
  MUSIC_LIBRARY = 'MUSIC_LIBRARY',
  VIDEO_LIBRARY = 'VIDEO_LIBRARY',
  NEWS_CENTER = 'NEWS_CENTER',
  STORAGE_MANAGER = 'STORAGE_MANAGER'
}

export enum NavSection {
  Dashboard = '仪表盘',
  Music = '音乐馆',
  Video = '视频中心',
  News = '全球资讯',
  Settings = '系统设置',
  Storage = '存储管理'
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