
import React, { useState, useEffect } from 'react';
import { Song, NotificationType } from '../types';
import { searchGlobalMusic, fetchTrendingMusic } from '../services/discoveryService';

interface DiscoveryProps {
  onPlaySong: (song: Song) => void;
  onNotify: (msg: string, type: NotificationType) => void;
}

const Discovery: React.FC<DiscoveryProps> = ({ onPlaySong, onNotify }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [trending, setTrending] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTag, setActiveTag] = useState('这辈子');

  useEffect(() => {
    setIsSearching(true);
    fetchTrendingMusic(40).then(v => {
        setTrending(v);
        setIsSearching(false);
    });
  }, []);

  const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const targetQuery = customQuery || query;
    if (!targetQuery.trim()) return;

    setIsSearching(true);
    onNotify(`正在全网探测 “${targetQuery}” 的完整波段...`, 'info');
    
    try {
      const { data } = await searchGlobalMusic(targetQuery, 50);
      setResults(data);
      if (data.length === 0) {
        onNotify('地球太大了，这个波段目前没有完整回响，请换个词试试', 'warning');
      } else {
        onNotify(`成功捕获 ${data.length} 条全量完整音轨信号`, 'success');
      }
    } catch (e) {
      onNotify('跨维搜索链路受阻，请检查网络', 'error');
    }
    setIsSearching(false);
  };

  const handleTagClick = (tag: string) => {
    setActiveTag(tag);
    setQuery(tag);
    handleSearch(undefined, tag);
  };

  const currentList = results.length > 0 ? results : trending;

  return (
    <div className="h-full flex flex-col bg-transparent overflow-y-auto custom-scrollbar">
      <div className="p-8 md:p-16 space-y-12 max-w-[1400px] mx-auto w-full pb-40">
        
        {/* 顶部标题区 */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white aurora-text high-light">全量频率</h1>
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
              {['这辈子', '空头支票', '深夜 DJ', '遗憾民谣', '财经人物', '江湖往事', '情感访谈'].map(tag => (
                <button 
                  key={tag} 
                  onClick={() => handleTagClick(tag)}
                  className={`text-[12px] font-black whitespace-nowrap px-5 py-2 rounded-full border-2 transition-all ${activeTag === tag ? 'bg-white text-black border-white shadow-xl scale-105' : 'bg-white/5 text-white border-white/20 hover:border-white'}`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSearch} className="relative w-full lg:w-[450px] group">
            <div className="absolute inset-0 bg-red-600/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <input 
              type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="搜索任何完整版歌曲或心情..." 
              className="relative w-full bg-black/40 border-2 border-white/40 rounded-[2rem] py-5 px-14 text-base font-black text-white placeholder-white/30 focus:bg-black/60 outline-none transition-all focus:border-white shadow-2xl"
            />
            <i className={`fa-solid ${isSearching ? 'fa-spinner animate-spin text-red-500' : 'fa-earth-asia text-white'} absolute left-6 top-1/2 -translate-y-1/2 text-lg`}></i>
          </form>
        </header>

        {/* 核心列表 */}
        <section className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <div className="flex items-center justify-between border-b-2 border-white/20 pb-8">
            <div className="flex flex-col gap-2">
               <h3 className="text-sm font-black tracking-[0.4em] flex items-center gap-4 uppercase text-white high-light">
                <i className="fa-solid fa-satellite text-red-600 animate-pulse text-xl"></i>
                {results.length > 0 ? `“${query}” 的全球映射结果` : '当前地球最热回响 · FULL LENGTH'}
              </h3>
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest italic high-light">Signal quality: 100% · Establishing High-Fidelity Connection</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-10">
            {currentList.map((song) => (
              <div 
                key={song.id} 
                onClick={() => onPlaySong(song)}
                className="group space-y-5 cursor-pointer"
              >
                <div className="relative aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl border-2 border-white/20 bg-zinc-900 transition-transform duration-500 group-hover:-translate-y-3">
                  <img src={song.coverUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={song.name} loading="lazy" />
                  
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center backdrop-blur-sm p-4 text-center">
                    <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center border-2 border-white mb-4 scale-75 group-hover:scale-100 transition-transform duration-500 shadow-2xl">
                      <i className="fa-solid fa-play text-xl ml-1"></i>
                    </div>
                    <p className="text-[12px] font-black text-white uppercase tracking-widest italic line-clamp-2 high-light">“播放完整回响”</p>
                  </div>

                  {/* 状态标注 */}
                  <div className="absolute top-5 left-5">
                    <div className="bg-red-600 px-3 py-1 rounded-lg shadow-2xl border border-white/30">
                      <span className="text-[8px] font-black text-white uppercase tracking-widest">完整音轨</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 px-2">
                  <p className="text-sm md:text-base font-black text-white truncate group-hover:text-red-500 transition-colors high-light">{song.name}</p>
                  <div className="flex items-center gap-3">
                    <p className="text-[11px] font-bold text-white uppercase tracking-[0.2em] truncate italic high-light">{song.artist}</p>
                    <span className="w-1.5 h-1.5 rounded-full bg-white/40"></span>
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest high-light">24-bit HD</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 加载状态 */}
        {isSearching && (
          <div className="py-40 flex flex-col items-center justify-center space-y-10">
            <div className="relative">
                <div className="w-24 h-24 border-4 border-red-600/30 rounded-full animate-ping absolute inset-0"></div>
                <div className="w-24 h-24 border-4 border-t-white border-white/10 rounded-full animate-spin relative flex items-center justify-center shadow-2xl">
                    <i className="fa-solid fa-satellite-dish text-white text-2xl animate-pulse"></i>
                </div>
            </div>
            <div className="text-center space-y-4">
                <p className="text-xl font-black uppercase tracking-[0.5em] text-white high-light">全网频率深度扫描中</p>
                <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest italic high-light">正在请求完整版音频链路 · Establishing Secure Channel...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discovery;
