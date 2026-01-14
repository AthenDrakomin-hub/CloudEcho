
import { Song } from "../types";

// 代理池
const PROXIES = [
  'https://api.allorigins.win/get?url=',
  'https://api.codetabs.com/v1/proxy?quest='
];
const DEEZER_BASE = 'https://api.deezer.com';

interface ApiParams {
  index?: number;
  limit?: number;
  access_token?: string;
  request_method?: 'GET' | 'POST' | 'DELETE';
  [key: string]: any;
}

export const getToken = () => localStorage.getItem('dz_access_token');
export const setToken = (token: string, expires: number) => {
  localStorage.setItem('dz_access_token', token);
  localStorage.setItem('dz_token_expires', (Date.now() + expires * 1000).toString());
};
export const clearToken = () => {
  localStorage.removeItem('dz_access_token');
  localStorage.removeItem('dz_token_expires');
};

const apiRequest = async (path: string, params: ApiParams = {}): Promise<any> => {
  const token = getToken();
  const urlParams = new URLSearchParams();
  const combinedParams = { ...params };
  if (token && !combinedParams.access_token) {
    combinedParams.access_token = token;
  }
  Object.entries(combinedParams).forEach(([key, value]) => {
    if (value !== undefined) urlParams.append(key, String(value));
  });
  const queryString = urlParams.toString();
  const fullPath = `${path}${queryString ? (path.includes('?') ? '&' : '?') + queryString : ''}`;
  const rawTargetUrl = `${DEEZER_BASE}${fullPath}`;

  for (const proxyBase of PROXIES) {
    try {
      const targetUrl = proxyBase.includes('allorigins') ? encodeURIComponent(rawTargetUrl) : rawTargetUrl;
      const response = await fetch(proxyBase + targetUrl, { headers: { 'Accept': 'application/json' } });
      if (!response.ok) continue;
      const result = await response.json();
      let data = proxyBase.includes('allorigins') ? (result.contents ? JSON.parse(result.contents) : null) : result;
      if (data?.error) {
        if (data.error.code === 2000 || data.error.code === 3000) clearToken();
        return null;
      }
      return data;
    } catch (error) { continue; }
  }
  return null;
};

const formatTrack = (item: any): Song => ({
    id: `dz-${item.id}`,
    name: item.title,
    artist: item.artist.name,
    url: item.preview, 
    coverUrl: item.album.cover_xl || item.album.cover_big,
    isExternal: true,
    lyrics: ''
});

export const searchGlobalMusic = async (query: string, index = 0, limit = 20): Promise<{data: Song[], total: number}> => {
  if (!query) return { data: [], total: 0 };
  const response = await apiRequest('/search', { q: query, index, limit });
  if (!response || !response.data) return { data: [], total: 0 };
  return { data: response.data.map(formatTrack), total: response.total || 0 };
};

export const fetchMyHistory = async (limit = 50): Promise<Song[]> => {
    const response = await apiRequest('/user/me/history', { limit });
    if (!response || !response.data) return [];
    return response.data.map(formatTrack);
};

export const fetchMyPlaylists = async (limit = 50): Promise<any[]> => {
    const response = await apiRequest('/user/me/playlists', { limit });
    return response?.data || [];
};

export const fetchTrendingMusic = async (index = 0, limit = 20): Promise<Song[]> => {
  const response = await apiRequest('/chart/0/tracks', { index, limit });
  if (!response || !response.data) return [];
  return response.data.map(formatTrack);
};

export const fetchMyProfile = async () => {
  return await apiRequest('/user/me');
};

/**
 * 抓取在线歌词：移除 AI，改为占位内容或待后续扩展其他 API
 */
export const fetchLyricsOnline = async (artist: string, title: string): Promise<string | null> => {
  return `[00:00] 暂无歌词数据
[00:05] 歌曲: ${title}
[00:10] 艺术家: ${artist}
[00:15] “我这辈子得到了很多空头支票，你的永远也是其中一张。”`;
};
