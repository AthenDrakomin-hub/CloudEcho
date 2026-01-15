
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
  const [activeTag, setActiveTag] = useState('精选');

  useEffect(() => {
    fetchTrendingMusic(0, 30).then(setTrending);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const { data } = await searchGlobalMusic(query, 0, 30);
      setResults(data);
    } catch (e) {
      onNotify('云端连接异常', 'error');
    }
    setIsSearching(false);
  };

  const currentList = results.length > 0 ? results : trending;

  return (
    <div className="h-full flex flex-col bg-transparent overflow-y-auto custom-scrollbar">
      <div className="p-8 md:p-12 space-y-10 max-w-[1600px] mx-auto w-full pb-32">
        {/* 顶部搜索与推荐 */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-black italic tracking-tighter text-white">发现</h1>
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pb-2">
              {['精选', '排行榜', '电台', '数字专辑'].map(tag => (
                <button 
                  key={tag} 
                  onClick={() => setActiveTag(tag)}
                  className={`text-sm font-black whitespace-nowrap pb-1 border-b-2 transition-all ${activeTag === tag ? 'text-[#C20C0C] border-[#C20C0C]' : 'text-white/40 border-transparent hover:text-white'}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <form onSubmit={handleSearch} className="relative w-full md:w-80">
            <input 
              type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="搜索歌曲、艺术家..." 
              className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 px-10 text-xs text-white placeholder-white/20 focus:bg-white/10 outline-none transition-all"
            />
            <i className={`fa-solid ${isSearching ? 'fa-spinner animate-spin' : 'fa-magnifying-glass'} absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-[10px]`}></i>
          </form>
        </header>

        {/* 热门推荐列表 */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
              <i className="fa-solid fa-fire-flame-curved text-[#C20C0C]"></i>
              {results.length > 0 ? '搜索结果' : '热门信号推送'}
            </h3>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-6 md:gap-8">
            {currentList.map((song) => (
              <div 
                key={song.id} 
                onClick={() => onPlaySong(song)}
                className="group space-y-3 cursor-pointer"
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl border border-white/5">
                  <img src={song.coverUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={song.name} />
                  {/* 网易云播放量角标 */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full">
                    <i className="fa-solid fa-headphones text-[8px] text-white/80"></i>
                    <span className="text-[8px] font-mono text-white/80">{(Math.random()*100).toFixed(1)}k</span>
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-3xl rounded-full flex items-center justify-center border border-white/20">
                      <i className="fa-solid fa-play text-white ml-1"></i>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-black text-white/90 truncate group-hover:text-[#C20C0C] transition-colors">{song.name}</p>
                  <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest truncate">{song.artist}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Discovery;
