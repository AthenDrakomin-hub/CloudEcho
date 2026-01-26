
import React, { useState, useEffect, useRef } from 'react';
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    const loadChart = async () => {
      setIsLoadingChart(true);
      const data = await fetchTrendingMusic(0, PAGE_SIZE);
      setTrending(data);
      setIsLoadingChart(false);
    };
    loadChart();
  }, []);

  const handleSearch = async (e?: React.FormEvent, isLoadMore = false) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    const newIndex = isLoadMore ? currentIndex + PAGE_SIZE : 0;
    
    if (isLoadMore) setIsLoadingMore(true);
    else setIsSearching(true);

    try {
      const { data, total } = await searchGlobalMusic(query, newIndex, PAGE_SIZE);
      
      if (isLoadMore) {
        setResults(prev => [...prev, ...data]);
      } else {
        setResults(data);
        setTotalResults(total);
        if (data.length === 0) onNotify('未检测到相关情感信号', 'info');
      }
      
      setCurrentIndex(newIndex);
    } catch (e) {
      onNotify('链路建立异常，请重试', 'error');
    } finally {
      setIsSearching(false);
      setIsLoadingMore(false);
    }
  };

  const handleClear = () => {
    setResults([]);
    setQuery('');
    setCurrentIndex(0);
    setTotalResults(0);
  };

  const currentList = results.length > 0 ? results : trending;
  const isShowResults = results.length > 0;
  const hasMore = isShowResults && results.length < totalResults;

  return (
    <div className="h-full flex flex-col p-6 md:p-16 overflow-hidden bg-transparent">
      <header className="mb-10 md:mb-14 space-y-8 md:space-y-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6 md:space-x-12">
             <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 rounded-[2rem] md:rounded-[2.8rem] flex items-center justify-center shadow-[0_20px_60px_-10px_rgba(99,102,241,0.6)] group border border-white/20">
                <i className="fa-solid fa-satellite-dish text-white text-2xl md:text-4xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-700"></i>
             </div>
             <div className="space-y-2 md:space-y-4">
                <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter italic leading-none drop-shadow-2xl aurora-text">极光信号</h1>
                <div className="flex items-center space-x-3 md:space-x-4">
                   <span className="hidden md:block h-[1px] w-10 bg-indigo-500/50"></span>
                   <p className="text-[9px] md:text-[11px] text-white/40 font-black uppercase tracking-[0.4em] md:tracking-[0.8em]">同步全球音乐流 · 共享计划 V4.2</p>
                </div>
             </div>
          </div>
          {isShowResults && (
            <button 
              onClick={handleClear} 
              className="px-6 md:px-10 py-3 md:py-5 bg-white/5 border border-white/15 rounded-[1.5rem] md:rounded-[2rem] text-[9px] md:text-[10px] font-black uppercase text-indigo-400 hover:bg-white/10 hover:text-white transition-all tracking-widest shadow-3xl"
            >
              重置
            </button>
          )}
        </div>

        <div className="max-w-6xl">
          <form onSubmit={(e) => handleSearch(e)} className="relative group">
            <input 
              type="text" 
              placeholder="搜索全球曲库，同步情感共鸣..." 
              className="w-full bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] md:rounded-[3.5rem] py-6 md:py-10 px-8 md:px-14 pr-24 md:pr-40 text-base md:text-xl font-black text-white outline-none focus:bg-white/[0.08] focus:border-indigo-500/50 transition-all placeholder-white/15"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button 
              type="submit"
              disabled={isSearching}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-14 h-14 md:w-24 md:h-24 bg-white text-black rounded-[1.8rem] md:rounded-[2.5rem] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl disabled:opacity-50"
            >
              {isSearching ? <i className="fa-solid fa-spinner animate-spin text-xl"></i> : <i className="fa-solid fa-magnifying-glass text-xl md:text-3xl"></i>}
            </button>
          </form>
        </div>
      </header>

      <div className="mb-8 md:mb-12 flex items-center justify-between px-4 md:px-8">
         <div className="flex flex-col">
            <h2 className="text-sm md:text-[16px] font-black text-white uppercase tracking-[0.5em] md:tracking-[1em] italic drop-shadow-md aurora-text">
                {isShowResults ? `同步结果 (Nodes: ${totalResults})` : "极光热榜 (Trending Signals)"}
            </h2>
            <span className="text-[7px] md:text-[8px] font-bold text-white/20 uppercase tracking-[0.4em] md:tracking-[0.5em] mt-2 italic">
               ATMOSPHERE STABLE · READY TO MAP
            </span>
         </div>
         <div className="flex items-center space-x-4 bg-white/5 px-4 md:px-8 py-2 md:py-4 rounded-full border border-white/10">
            <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full animate-pulse ${isShowResults ? 'bg-indigo-500 shadow-[0_0_15px_indigo]' : 'bg-green-500 shadow-[0_0_15px_green]'}`}></div>
            <span className="text-[8px] md:text-[10px] font-black text-white/30 uppercase tracking-widest">{isShowResults ? 'SYNCING' : 'READY'}</span>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pr-2 md:pr-6">
        {isLoadingChart && !isShowResults ? (
          <div className="h-full flex flex-col items-center justify-center space-y-12 opacity-20">
             <div className="w-16 h-16 border-[4px] border-white/5 border-t-indigo-500 rounded-full animate-spin"></div>
             <p className="text-[10px] font-black uppercase tracking-[1em] animate-pulse">正在映射云端数据链...</p>
          </div>
        ) : (
          <div className="space-y-16 md:space-y-24 pb-32">
            <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-6 md:gap-16">
                {currentList.map((song) => (
                <div 
                    key={song.id}
                    className="group bg-white/[0.03] border border-white/10 rounded-[2.5rem] md:rounded-[4.5rem] p-4 md:p-10 hover:bg-white/[0.08] hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,1)] transition-all duration-1000 cursor-pointer flex flex-col relative overflow-hidden"
                    onClick={() => {
                        onPlaySong(song);
                        onNotify(`已建立情感连接: ${song.name}`, 'info');
                    }}
                >
                    <div className="relative aspect-square rounded-[2rem] md:rounded-[4rem] overflow-hidden shadow-2xl mb-6 md:mb-12 group-hover:scale-[1.05] transition-all duration-1000 ring-1 ring-white/10">
                        <img src={song.coverUrl} className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-1000" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 flex flex-col items-center justify-center">
                            <div className="w-12 h-12 md:w-24 md:h-24 bg-white rounded-[1.2rem] md:rounded-[2.8rem] flex items-center justify-center shadow-3xl scale-75 group-hover:scale-100 transition-all duration-1000 text-black">
                                <i className="fa-solid fa-play text-xl md:text-4xl ml-1"></i>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2 md:space-y-4 px-2 md:px-6 relative z-10">
                        <h4 className="text-sm md:text-xl font-black text-white truncate tracking-tighter group-hover:aurora-text transition-all duration-700 italic">{song.name}</h4>
                        <div className="flex items-center justify-between border-t border-white/5 pt-2 md:pt-4">
                           <p className="text-[9px] md:text-[12px] font-black text-indigo-400/80 uppercase tracking-[0.2em] truncate">{song.artist}</p>
                           <i className="fa-solid fa-wave-square text-white/10 group-hover:text-pink-500/40 transition-colors text-[8px] md:text-xs"></i>
                        </div>
                    </div>
                    <div className="absolute -bottom-6 -right-6 text-[60px] md:text-[120px] font-black text-white/[0.01] italic select-none pointer-events-none group-hover:text-white/[0.05] transition-all duration-1000">ECHO</div>
                </div>
                ))}
            </div>

            {hasMore && (
                <div className="flex justify-center pt-12 md:pt-24">
                    <button 
                        onClick={() => handleSearch(undefined, true)}
                        disabled={isLoadingMore}
                        className="px-12 md:px-24 py-4 md:py-8 bg-white text-black rounded-[1.5rem] md:rounded-[2.5rem] text-[10px] md:text-[13px] font-black uppercase tracking-[0.4em] md:tracking-[0.8em] shadow-2xl hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isLoadingMore ? <i className="fa-solid fa-spinner animate-spin mr-4"></i> : <i className="fa-solid fa-bolt-lightning mr-4"></i>}
                        <span>{isLoadingMore ? '映射中...' : '加载更多极光节点'}</span>
                    </button>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Discovery;
