
import { Song } from "../types";

/**
 * 发现频率核心服务 V5 - 全球分布式波段
 * 使用多个公开节点作为负载均衡，确保即使部分节点宕机也能获取完整音轨。
 */

// 公开的 API 节点集群，用于冗余备份
const API_NODES = [
  'https://api.injahow.cn/meting/',
  'https://meting-api.isoyu.com/',
  'https://api.i-meto.com/meting/api',
];

// 智能波段映射
const SEARCH_MAP: Record<string, string> = {
  '财经人物': '财经 故事',
  '空头支票': '承诺 遗憾',
  '这辈子': '感慨 往事 纯音乐',
  '深夜 DJ': 'DJ Remix 流行',
  '江湖往事': '民谣 江湖',
  '遗憾民谣': '民谣 孤独'
};

const FALLBACK_COVERS = [
    'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=800',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800',
    'https://images.unsplash.com/photo-1514525253361-bee87184f830?q=80&w=800'
];

/**
 * 带有自动降级功能的 fetch 包装器
 */
const fetchWithFallback = async (params: string) => {
    let lastError = null;
    for (const node of API_NODES) {
        try {
            const separator = node.includes('?') ? '&' : '?';
            const url = `${node}${separator}${params}`;
            const response = await fetch(url, { method: 'GET', mode: 'cors' });
            if (!response.ok) continue;
            const data = await response.json();
            if (data) return { data, node }; // 返回成功的数据和所用节点
        } catch (e) {
            lastError = e;
            console.warn(`Node ${node} failed, trying next...`);
        }
    }
    throw lastError || new Error("All frequency nodes are unreachable.");
};

/**
 * 核心检索逻辑：从集群节点搜索
 */
export const searchGlobalMusic = async (query: string, limit = 50): Promise<{data: Song[], total: number}> => {
  if (!query) return { data: [], total: 0 };
  const searchTerm = SEARCH_MAP[query] || query;
  
  try {
    // 默认尝试网易云源，失败后自动由 fetchWithFallback 切换节点或尝试备用源逻辑
    const { data } = await fetchWithFallback(`server=netease&type=search&id=${encodeURIComponent(searchTerm)}`);
    
    if (!Array.isArray(data) || data.length === 0) {
        // 如果搜不到结果，切换至 Migu 源（版权极广）
        const miguRes = await fetchWithFallback(`server=migu&type=search&id=${encodeURIComponent(searchTerm)}`);
        return processResults(Array.isArray(miguRes.data) ? miguRes.data : [], query, 'migu');
    }

    return processResults(data, query, 'netease');
  } catch (error) {
    console.error("Signal Capture Error (All Nodes Failed):", error);
    return { data: [], total: 0 };
  }
};

/**
 * 物理链路解析：使用节点集群解析真实 URL
 */
export const resolveMusicUrl = async (song: Song): Promise<string> => {
    if (!song.id.startsWith('global-')) return song.url;
    
    try {
        const parts = song.id.split('-');
        const server = parts[1];
        const id = parts[2];
        
        // 同样使用节点集群进行 URL 解析
        const { data } = await fetchWithFallback(`server=${server}&type=url&id=${id}`);
        
        if (data && data.url) {
            // 解决混杂内容问题，强制 HTTPS
            return data.url.replace(/^http:/, 'https:');
        }
        
        // 如果获取失败，尝试通过 type=song 获取详情中可能包含的 url
        const detail = await fetchWithFallback(`server=${server}&type=song&id=${id}`);
        if (detail.data && detail.data[0]?.url) {
            return detail.data[0].url.replace(/^http:/, 'https:');
        }

        throw new Error("No playback link captured.");
    } catch (e) {
        console.error("Resolve failed on all nodes:", e);
        return song.url; 
    }
};

const processResults = (raw: any[], originalTag: string, server: string): {data: Song[], total: number} => {
    const songs: Song[] = raw.map((item: any, idx: number) => ({
        id: `global-${server}-${item.id || item.songid}`,
        name: item.title || item.name || '未知频率',
        artist: item.author || item.artist || '佚名',
        url: '', // 初始留空，播放时通过 resolveMusicUrl 解析
        coverUrl: item.pic || item.cover || FALLBACK_COVERS[idx % FALLBACK_COVERS.length],
        isExternal: true,
        lyrics: `[00:00] 正在捕获全量波段...\n[00:05] “地球虽大，但我总能为你找到这一首回响。”`,
        tags: [originalTag, '全量波段']
    }));
    return { data: songs, total: songs.length };
};

export const fetchTrendingMusic = async (limit = 32): Promise<Song[]> => {
  const { data } = await searchGlobalMusic('这辈子', limit);
  return data;
};
