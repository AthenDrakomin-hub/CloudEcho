
export interface Song {
  id: string;
  name: string;
  artist: string;
  url: string;
  coverUrl: string;
  size?: number;
  lastModified?: Date;
  lyrics?: string;
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
}

export enum PlaybackMode {
  SEQUENCE = 'SEQUENCE',
  SHUFFLE = 'SHUFFLE',
  REPEAT_ONE = 'REPEAT_ONE'
}

export interface Quote {
  id: number;
  content: string;
  category: string;
}

export enum ViewMode {
  PLAYER = 'PLAYER',
  MANAGER = 'MANAGER',
  VIDEO = 'VIDEO',
  API_DOCS = 'API_DOCS',
  SONG_DETAILS = 'SONG_DETAILS'
}
