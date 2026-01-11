
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

  // 初始加载热榜
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
        if (data.length === 0) onNotify('未找到相关内容', 'info');
      }
      
      setCurrentIndex(newIndex);
    } catch (e) {
      onNotify('搜索失败，请重试', 'error');
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
    <div className="h-full flex flex-col p-8 md:p-14 overflow-hidden bg-transparent">
      <header className="mb-12 space-y-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
             <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[1.5rem] flex items-center justify-center shadow-[0_20px_40px_-10px_rgba(99,102,241,0.5)]">
                <i className="fa-solid fa-earth-asia text-white text-2xl"></i>
             </div>
             <div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter italic leading-none drop-shadow-lg">发现极光</h1>
                <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.5em] mt-3">搜索全球海量音乐库 · 捕获情感信号</p>
             </div>
          </div>
          {isShowResults && (
            <button 
              onClick={handleClear} 
              className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase text-indigo-400 hover:bg-white/10 transition-all tracking-widest"
            >
              重置发现
            </button>
          )}
        </div>

        <form onSubmit={(e) => handleSearch(e)} className="max-w-4xl relative group">
          <input 
            type="text" 
            placeholder="输入歌手、歌名或“空头支票”，开启共鸣..." 
            className="w-full bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] py-6 px-10 pr-24 text-base font-black text-white outline-none focus:bg-white/[0.07] focus:border-indigo-500/50 focus:shadow-[0_0_50px_-10px_rgba(99,102,241,0.3)] transition-all placeholder-white/20"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button 
            type="submit"
            disabled={isSearching}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 bg-white text-black rounded-[1.5rem] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-2xl disabled:opacity-50"
          >
            {isSearching ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-magnifying-glass text-xl"></i>}
          </button>
        </form>
      </header>

      <div className="mb-8 flex items-center justify-between px-4">
         <div className="flex flex-col">
            <h2 className="text-sm font-black text-white uppercase tracking-[0.4em] italic drop-shadow-md">
                {isShowResults ? `映射结果 (${totalResults})` : "流行共鸣 (Live Charts)"}
            </h2>
            <span className="text-[8px] font-bold text-white/20 uppercase tracking-[0.3em] mt-1">
               {isShowResults ? 'SIGNAL ACQUIRED' : 'ATMOSPHERE STABLE'}
            </span>
         </div>
         <div className="flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-full border border-white/5">
            <span className={`w-2 h-2 rounded-full animate-pulse ${isShowResults ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)]' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,1)]'}`}></span>
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                {isShowResults ? 'Searching' : 'Live'}
            </span>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
        {isLoadingChart && !isShowResults ? (
          <div className="h-full flex flex-col items-center justify-center space-y-8 opacity-20">
             <div className="w-16 h-16 border-4 border-white/5 border-t-indigo-500 rounded-full animate-spin"></div>
             <p className="text-[11px] font-black uppercase tracking-[0.8em] animate-pulse">正在同步云端信号...</p>
          </div>
        ) : (
          <div className="space-y-16 pb-24">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-8 md:gap-12">
                {currentList.map((song) => (
                <div 
                    key={song.id}
                    className="group bg-white/[0.02] border border-white/5 rounded-[3rem] p-6 hover:bg-white/[0.06] hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] transition-all duration-700 cursor-pointer flex flex-col"
                    onClick={() => {
                        onPlaySong(song);
                        onNotify(`已捕获信号: ${song.name}`, 'info');
                    }}
                >
                    <div className="relative aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl mb-8 group-hover:scale-[1.03] transition-transform duration-1000 ring-1 ring-white/10">
                        <img src={song.coverUrl} className="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 transition-all duration-1000" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                            <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-all duration-500">
                                <i className="fa-solid fa-play text-black text-xl ml-1"></i>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2 px-3">
                        <h4 className="text-base font-black text-white truncate tracking-tighter group-hover:aurora-text transition-all">{song.name}</h4>
                        <div className="flex items-center justify-between">
                           <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest opacity-60 truncate">{song.artist}</p>
                           <span className="text-[8px] text-white/10 font-bold group-hover:text-white/30 transition-colors uppercase tracking-widest">Digital Node</span>
                        </div>
                    </div>
                </div>
                ))}
            </div>

            {hasMore && (
                <div className="flex justify-center pt-10">
                    <button 
                        onClick={() => handleSearch(undefined, true)}
                        disabled={isLoadingMore}
                        className="px-16 py-5 bg-white text-black rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.4em] shadow-[0_20px_50px_-10px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-4"
                    >
                        {isLoadingMore ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-chevron-down"></i>}
                        <span>{isLoadingMore ? '正在建立映射链接...' : '加载更多映射节点'}</span>
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
