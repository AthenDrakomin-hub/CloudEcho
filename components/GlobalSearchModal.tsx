
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Song, Video } from '../types';

interface GlobalSearchModalProps {
  songs: Song[];
  videos: Video[];
  onClose: () => void;
  onPlaySong: (song: Song) => void;
  onPlayVideo: (video: Video) => void;
}

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ songs, videos, onClose, onPlaySong, onPlayVideo }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return { songs: [], videos: [] };
    const q = query.toLowerCase();
    const fs = songs.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.artist.toLowerCase().includes(q) || 
      s.tags?.some(t => t.toLowerCase().includes(q))
    ).slice(0, 8);
    const fv = videos.filter(v => 
      v.name.toLowerCase().includes(q) || 
      v.artist.toLowerCase().includes(q)
    ).slice(0, 4);
    return { songs: fs, videos: fv };
  }, [query, songs, videos]);

  const isEmpty = query.trim() !== '' && results.songs.length === 0 && results.videos.length === 0;

  return (
    <div className="fixed inset-0 z-[3000] flex items-start justify-center pt-[15vh] px-4 md:px-0">
      {/* 极淡的背景遮罩，增加透气感 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      
      {/* 灵动搜索容器 */}
      <div className="relative w-full max-w-2xl bg-zinc-900/80 backdrop-blur-3xl rounded-[2.5rem] border border-white/20 shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-500 flex flex-col">
        
        {/* 输入区域 */}
        <div className="p-6 md:p-8 border-b border-white/10 flex items-center space-x-6">
          <i className="fa-solid fa-magnifying-glass text-red-500 text-xl animate-pulse"></i>
          <input 
            ref={inputRef}
            type="text" 
            placeholder="搜索歌名、歌手、或者此时的心情..." 
            className="flex-1 bg-transparent border-none outline-none text-lg md:text-xl font-black text-white placeholder-white/10"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="hidden md:flex items-center gap-2">
             <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-mono text-white/40">ESC 退出</kbd>
          </div>
        </div>

        {/* 结果区域 - 限制最大高度，防止撑满屏幕 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 max-h-[50vh]">
          {query.trim() === '' ? (
            <div className="py-10 flex flex-col items-center space-y-4 opacity-40">
               <i className="fa-solid fa-wand-magic-sparkles text-2xl text-red-500"></i>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] italic text-center">输入关键词，唤醒子夜信号...</p>
               <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {['DJ', '伤感', '这辈子', '空头支票'].map(tag => (
                    <span key={tag} onClick={() => setQuery(tag)} className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black hover:bg-red-600/20 hover:text-red-500 transition-all cursor-pointer border border-white/5">#{tag}</span>
                  ))}
               </div>
            </div>
          ) : isEmpty ? (
            <div className="py-16 text-center space-y-4 opacity-40">
               <i className="fa-solid fa-satellite-slash text-4xl"></i>
               <p className="text-xs font-bold uppercase tracking-widest italic">该频率暂无共鸣，请更换关键词</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* 歌曲结果 */}
              {results.songs.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] pl-2">音频轨道 · AUDIO TRACKS</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {results.songs.map(song => (
                      <div 
                        key={song.id} 
                        onClick={() => onPlaySong(song)} 
                        className="group flex items-center p-3 rounded-2xl bg-white/5 border border-transparent hover:bg-red-600/10 hover:border-red-500/30 transition-all cursor-pointer"
                      >
                        <div className="relative w-12 h-12 rounded-xl mr-4 overflow-hidden shadow-lg flex-shrink-0">
                           <img src={song.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                           <div className="absolute inset-0 bg-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <div className="flex-1 truncate">
                          <p className="text-sm font-black text-white truncate group-hover:text-red-500 transition-colors">{song.name}</p>
                          <p className="text-[9px] font-bold text-white/30 truncate uppercase mt-0.5 italic group-hover:text-white/50 transition-colors">{song.artist}</p>
                        </div>
                        <i className="fa-solid fa-chevron-right text-[10px] text-white/10 group-hover:translate-x-1 group-hover:text-red-500 transition-all"></i>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 视频结果 */}
              {results.videos.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] pl-2">映画映射 · VIDEO NODES</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {results.videos.map(video => (
                      <div 
                        key={video.id} 
                        onClick={() => onPlayVideo(video)} 
                        className="group flex items-center p-3 rounded-2xl bg-white/5 border border-transparent hover:bg-indigo-600/10 hover:border-indigo-500/30 transition-all cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-xl bg-zinc-800 mr-4 flex items-center justify-center flex-shrink-0">
                           <i className="fa-solid fa-film text-white/20 group-hover:text-indigo-400 group-hover:rotate-12 transition-all"></i>
                        </div>
                        <div className="flex-1 truncate">
                          <p className="text-sm font-black text-white truncate group-hover:text-indigo-400 transition-colors">{video.name}</p>
                          <p className="text-[9px] font-bold text-white/30 truncate uppercase mt-0.5 italic">Video Memory</p>
                        </div>
                        <i className="fa-solid fa-play text-[10px] text-white/10 group-hover:text-indigo-400 transition-all"></i>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部信息提示 */}
        <div className="p-4 bg-black/40 border-t border-white/5 text-center">
           <p className="text-[8px] font-black text-white/10 uppercase tracking-[0.5em]">Global Resonance Search Node · Powered by Aurora Sync</p>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
