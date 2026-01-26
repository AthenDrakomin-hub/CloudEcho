
export interface NewsItem {
  tag: string;
  headline: string;
  timestamp: string;
  source: string;
  isUrgent?: boolean;
}

export interface SystemStats {
  cpu: number;
  memory: string;
  latency: string;
  uptime: string;
}

export enum NavSection {
  Dashboard = '仪表盘',
  Music = '音乐馆',
  Video = '视频中心',
  News = '全球资讯',
  Settings = '系统设置',
  Storage = '存储管理'
}
