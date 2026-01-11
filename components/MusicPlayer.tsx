
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Song, PlaybackMode } from '../types';
import { EMOTIONAL_QUOTES } from '../constants';
import { generateSoulQuote } from '../services/aiService';

interface MusicPlayerProps {
  songs: Song[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  playbackMode: PlaybackMode;
  onModeChange: (mode: PlaybackMode) => void;
}

interface LyricLine {
  time: number;
  text: string;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ 
  songs, currentIndex, onIndexChange, isPlaying, onTogglePlay, currentTime, duration, onSeek, audioRef, playbackMode, onModeChange
}) => {
  const lyricsScrollRef = useRef<HTMLDivElement>(null);
  const [activeQuote, setActiveQuote] = useState(EMOTIONAL_QUOTES[0].content);
  const [quoteKey, setQuoteKey] = useState(0); 
  const [volume, setVolume] = useState(0.8);
  const [isFlipped, setIsFlipped] = useState(false); 
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [playlistPage, setPlaylistPage] = useState(0);
  const [isSoulLoading, setIsSoulLoading] = useState(false);
  const PAGE_SIZE = 6;

  const currentSong = songs[currentIndex];

  const handleMagicSpark = async () => {
    setIsSoulLoading(true);
    try {
      if (currentSong) {
        const soulQuote = await generateSoulQuote(currentSong.name, currentSong.artist);
        setActiveQuote(soulQuote);
      } else {
        const randomIdx = Math.floor(Math.random() * EMOTIONAL_QUOTES.length);
        setActiveQuote(EMOTIONAL_QUOTES[randomIdx].content);
      }
    } catch (e) {
      const randomIdx = Math.floor(Math.random() * EMOTIONAL_QUOTES.length);
      setActiveQuote(EMOTIONAL_QUOTES[randomIdx].content);
    } finally {
      setIsSoulLoading(false);
      setQuoteKey(prev => prev.fill !== undefined ? prev + 1 : 1);
      setQuoteKey(prev => prev + 1);
    }
  };

  const getModeIcon = () => {
    switch (playbackMode) {
      case PlaybackMode.SHUFFLE: return 'fa-shuffle';
      case PlaybackMode.REPEAT_ONE: return 'fa-rotate-left';
      default: return 'fa-list-ol';
    }
  };

  const cyclePlaybackMode = () => {
    const modes = [PlaybackMode.SEQUENCE, PlaybackMode.SHUFFLE, PlaybackMode.REPEAT_ONE];
    const nextIdx = (modes.indexOf(playbackMode) + 1) % modes.length;
    onModeChange(modes[nextIdx]);
  };

  const parsedLyrics = useMemo<LyricLine[]>(() => {
    if (!currentSong?.lyrics) return [];
    return currentSong.lyrics.split('\n').map(line => {
      const match = line.match(/\[(\d{2}):(\d{2})\]/);
      if (match) {
        return { 
          time: parseInt(match[1]) * 60 + parseInt(match[2]), 
          text: line.replace(/\[\d{2}:\d{2}\]/, '').trim() 
        };
      }
      return { time: -1, text: line.trim() };
    }).filter(l => l.text !== '');
  }, [currentSong?.lyrics]);

  const activeLyricIndex = useMemo(() => {
    for (let i = parsedLyrics.length - 1; i >= 0; i--) {
      if (currentTime >= parsedLyrics[i].time && parsedLyrics[i].time !== -1) return i;
    }
    return -1;
  }, [currentTime, parsedLyrics]);

  useEffect(() => {
    if (lyricsScrollRef.current && activeLyricIndex !== -1) {
      const activeEl = lyricsScrollRef.current.children[activeLyricIndex] as HTMLElement;
      if (activeEl) {
        lyricsScrollRef.current.scrollTo({
          top: activeEl.offsetTop - lyricsScrollRef.current.offsetHeight / 2,
          behavior: 'smooth'
        });
      }
    }
  }, [activeLyricIndex]);

  const totalPages = Math.ceil(songs.length / PAGE_SIZE);
  const paginatedPlaylist = useMemo(() => {
    return songs.slice(playlistPage * PAGE_SIZE, (playlistPage + 1) * PAGE_SIZE);
  }, [songs, playlistPage]);

  if (!currentSong) return null;

  return (
    <div className="h-full flex flex-col relative overflow-hidden select-none bg-transparent text-white">
      
      {/* 顶部语录 */}
      <header className="h-[20%] flex flex-col items-center justify-center z-[60] px-8 py-4">
         <div key={quoteKey} onClick={handleMagicSpark} className={`animate-[fadeIn_1.2s] text-center max-w-3xl cursor-pointer group transition-all ${isSoulLoading ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.6em] mb-4 opacity-70 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
               <span className="w-8 h-[1px] bg-indigo-500/30"></span>
               <span>{isSoulLoading ? '正在唤醒灵魂共鸣...' : '# 子夜回响 · AURORA VOID'}</span>
               <span className="w-8 h-[1px] bg-indigo-500/30"></span>
            </p>
            <p className="text-lg md:text-2xl font-black tracking-tighter italic leading-snug group-hover:text-indigo-200 transition-colors drop-shadow-[0_2px_15px_rgba(0,0,0,0.5)] text-white/95">
              “{activeQuote}”
            </p>
         </div>
      </header>

      {/* 核心展示区 */}
      <main className="h-[55%] flex flex-col items-center justify-center p-6 relative perspective-3000 z-50">
        <div 
          className={`relative w-full max-w-[360px] md:max-w-[480px] h-full transition-transform duration-[1.2s] cubic-bezier(0.16, 1, 0.3, 1) preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* 正面：黑胶唱片视觉 */}
          <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center bg-white/[0.04] backdrop-blur-3xl rounded-[4rem] border border-white/10 shadow-[0_50px_120px_-20px_rgba(0,0,0,0.9)] p-10 group overflow-hidden">
            <div className={`relative w-[85%] aspect-square rounded-full overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] border-[12px] border-black/80 transition-all duration-[2s] ${isPlaying ? 'rotate-[360deg] animate-[spin_20s_linear_infinite] glow-indigo' : ''}`}>
              <img src={currentSong.coverUrl} className="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 transition-all duration-1000" alt="Cover" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.6)_100%)]"></div>
              {/* 唱片纹理 */}
              <div className="absolute inset-0 opacity-20 bg-[repeating-radial-gradient(circle_at_center,transparent,transparent_2px,rgba(255,255,255,0.1)_3px)]"></div>
            </div>
            
            <div className="mt-12 text-center space-y-3 w-full px-6">
              <h2 className="text-2xl md:text-4xl font-black tracking-tighter italic truncate aurora-text drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">{currentSong.name}</h2>
              <p className="text-[12px] font-black text-white/50 uppercase tracking-[0.6em] drop-shadow-sm">
                <i className="fa-solid fa-microphone-lines mr-3 text-indigo-400"></i>{currentSong.artist}
              </p>
            </div>

            <div className="mt-8 flex items-end justify-center space-x-1.5 h-10 opacity-60">
               {Array.from({length: 24}).map((_, i) => (
                 <div key={i} className={`w-[2px] bg-gradient-to-t from-indigo-600 to-pink-500 rounded-full ${isPlaying ? 'dj-bar-anim' : 'h-1.5'}`} style={{ animationDelay: `${i * 0.04}s`, height: `${10 + Math.random() * 40}%` }}></div>
               ))}
            </div>
          </div>

          {/* 背面：沉浸星空歌词 */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col glass-dark-morphism rounded-[4rem] shadow-[0_50px_120px_-20px_rgba(0,0,0,1)] overflow-hidden p-12 md:p-16 border border-white/10">
             <div className="mb-12 flex items-center justify-between opacity-50">
               <div className="flex flex-col">
                  <span className="text-[11px] font-black uppercase tracking-[0.8em] text-indigo-300">文字轨迹</span>
                  <span className="text-[8px] font-bold text-white/20 uppercase tracking-[0.4em] mt-1">LYRIC MAPPING</span>
               </div>
               <i className="fa-solid fa-moon-stars text-xl text-indigo-400 animate-pulse"></i>
             </div>
             
             <div 
               ref={lyricsScrollRef}
               className="flex-1 overflow-y-auto no-scrollbar flex flex-col space-y-14 py-[15vh] px-4"
             >
                {parsedLyrics.length > 0 ? (
                  parsedLyrics.map((line, idx) => (
                    <p 
                      key={idx}
                      className={`text-xl md:text-3xl font-black tracking-tighter transition-all duration-1000 text-center leading-relaxed ${
                        activeLyricIndex === idx 
                          ? 'text-white scale-110 opacity-100 drop-shadow-[0_0_25px_rgba(129,140,248,1)]' 
                          : 'text-white/15 opacity-5 blur-[1px]'
                      }`}
                    >
                      {line.text}
                    </p>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center space-y-10 opacity-30">
                     <i className="fa-solid fa-compass-drafting text-6xl animate-spin-slow"></i>
                     <p className="text-[11px] font-black uppercase tracking-[1em] italic text-indigo-400">正在检索情感数据...</p>
                  </div>
                )}
             </div>
             <p className="mt-10 text-center text-[10px] font-black uppercase tracking-[0.8em] opacity-40 hover:opacity-100 transition-opacity">点击返回视觉节点</p>
          </div>
        </div>
      </main>

      {/* 底部控制面板 */}
      <footer className="h-[25%] flex flex-col items-center justify-center px-10 md:px-32 pb-14 z-[60]">
        
        {/* 极光进度条 */}
        <div className="w-full max-w-5xl flex items-center gap-10 mb-12 group/prog">
          <span className="text-[11px] font-black text-white/30 tabular-nums w-14 text-center drop-shadow-md">{Math.floor(currentTime/60)}:{Math.floor(currentTime%60).toString().padStart(2,'0')}</span>
          <div className="flex-1 h-2 bg-white/5 rounded-full relative overflow-hidden ring-1 ring-white/5">
            <input 
              type="range" min="0" max={duration || 0} step="0.1" 
              value={currentTime} onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 z-30 cursor-pointer"
            />
            <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_30px_rgba(99,102,241,1)] transition-all duration-300" style={{ width: `${(currentTime/duration)*100}%` }}></div>
            <div className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_15px_white] z-20" style={{ left: `${(currentTime/duration)*100}%` }}></div>
          </div>
          <span className="text-[11px] font-black text-white/30 tabular-nums w-14 text-center drop-shadow-md">{Math.floor(duration/60)}:{Math.floor(duration%60).toString().padStart(2,'0')}</span>
        </div>

        {/* 核心控制组 */}
        <div className="w-full max-w-6xl flex items-center justify-between gap-6 md:gap-0">
          
          <div className="flex items-center space-x-10">
            <button 
              onClick={cyclePlaybackMode} 
              className={`w-14 h-14 flex items-center justify-center rounded-[1.5rem] transition-all duration-500 ${playbackMode !== PlaybackMode.SEQUENCE ? 'bg-indigo-500/30 text-indigo-400 border border-indigo-500/40 shadow-[0_0_30px_rgba(99,102,241,0.4)]' : 'text-white/30 hover:text-white hover:bg-white/10'}`}
              title="播放模式"
            >
              <i className={`fa-solid ${getModeIcon()} text-lg`}></i>
            </button>
            <button 
              onClick={() => setShowPlaylist(!showPlaylist)}
              className={`w-14 h-14 flex items-center justify-center rounded-[1.5rem] transition-all duration-500 ${showPlaylist ? 'bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.4)] scale-110' : 'text-white/30 hover:text-white hover:bg-white/10'}`}
              title="播放队列"
            >
              <i className="fa-solid fa-bars-staggered text-lg"></i>
            </button>
          </div>

          <div className="flex items-center gap-12 md:gap-20">
            <button onClick={() => onIndexChange((currentIndex - 1 + songs.length) % songs.length)} className="text-4xl text-white/30 hover:text-white transition-all hover:scale-125 hover:rotate-[-12deg] drop-shadow-2xl active:scale-90"><i className="fa-solid fa-backward-step"></i></button>
            <button 
              onClick={onTogglePlay} 
              className="w-24 h-24 md:w-28 md:h-28 rounded-[2.5rem] bg-white text-black flex items-center justify-center shadow-[0_30px_80px_-15px_rgba(255,255,255,0.5)] hover:scale-105 active:scale-90 transition-all group/play"
            >
              <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play ml-2'} text-3xl md:text-4xl group-hover/play:scale-110 transition-transform`}></i>
            </button>
            <button onClick={() => onIndexChange((currentIndex + 1) % songs.length)} className="text-4xl text-white/30 hover:text-white transition-all hover:scale-125 hover:rotate-[12deg] drop-shadow-2xl active:scale-90"><i className="fa-solid fa-forward-step"></i></button>
          </div>

          <div className="flex items-center space-x-10">
            <button 
              onClick={handleMagicSpark}
              className={`w-14 h-14 flex items-center justify-center rounded-[1.5rem] text-pink-400 bg-pink-400/20 hover:bg-pink-400/40 transition-all border border-pink-400/20 ${isPlaying ? 'magic-active' : ''} ${isSoulLoading ? 'animate-spin' : ''}`}
              title="灵魂共鸣"
            >
              <i className={`fa-solid ${isSoulLoading ? 'fa-spinner' : 'fa-sparkles'} text-lg`}></i>
            </button>
            <div className="hidden xl:flex items-center space-x-6 group/vol bg-white/5 p-4 rounded-3xl border border-white/5">
              <i className="fa-solid fa-volume-low text-indigo-400/50 group-hover/vol:text-indigo-400 transition-colors text-sm"></i>
              <div className="w-28 h-1.5 bg-white/10 rounded-full relative overflow-hidden">
                <input 
                  type="range" min="0" max="1" step="0.01" value={volume} 
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    if(audioRef.current) audioRef.current.volume = v;
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 z-30 cursor-pointer"
                />
                <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-400 to-purple-400" style={{ width: `${volume*100}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* 全局播放队列 - 移至顶层并提升 z-index，防止由于 overflow: hidden 或 lower z-index 被遮挡 */}
      {showPlaylist && (
        <div className="absolute right-6 md:right-20 top-[15%] bottom-[15%] w-[320px] md:w-[440px] glass-dark-morphism rounded-[3.5rem] shadow-[0_100px_250px_-50px_rgba(0,0,0,1)] z-[500] p-10 animate-[fadeIn_0.5s] border border-white/20 ring-1 ring-white/10 flex flex-col">
           <div className="flex items-center justify-between mb-10 px-2 flex-shrink-0">
              <div className="flex flex-col">
                 <h4 className="text-[14px] font-black uppercase tracking-[0.6em] aurora-text">序列清单</h4>
                 <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em] mt-1">AURORA SEQUENCE</span>
              </div>
              <button onClick={() => setShowPlaylist(false)} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/10 shadow-lg"><i className="fa-solid fa-xmark"></i></button>
           </div>
           
           <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-2">
              {paginatedPlaylist.map((s, idx) => {
                const globalIdx = playlistPage * PAGE_SIZE + idx;
                return (
                  <div 
                    key={s.id} 
                    onClick={() => onIndexChange(globalIdx)}
                    className={`flex items-center space-x-6 p-5 rounded-[2.5rem] cursor-pointer transition-all border ${currentIndex === globalIdx ? 'bg-indigo-500/30 border-indigo-500/50 text-indigo-200 scale-[1.03] shadow-2xl' : 'hover:bg-white/5 border-transparent text-white/30'}`}
                  >
                    <div className="w-16 h-16 rounded-3xl overflow-hidden flex-shrink-0 shadow-2xl border border-white/10 group-hover:scale-110 transition-transform">
                      <img src={s.coverUrl} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-black truncate ${currentIndex === globalIdx ? 'text-white' : 'text-white/80'}`}>{s.name}</p>
                      <p className="text-[10px] font-bold uppercase opacity-50 truncate tracking-widest mt-1.5 italic">{s.artist}</p>
                    </div>
                    {currentIndex === globalIdx && (
                      <div className="flex items-end space-x-1 h-4 px-2">
                         <div className="w-[3px] bg-indigo-400 rounded-full animate-[dj-bar_0.5s_ease-in-out_infinite_alternate]"></div>
                         <div className="w-[3px] bg-indigo-400 rounded-full animate-[dj-bar_0.8s_ease-in-out_infinite_alternate_0.2s]"></div>
                         <div className="w-[3px] bg-indigo-400 rounded-full animate-[dj-bar_0.6s_ease-in-out_infinite_alternate_0.4s]"></div>
                      </div>
                    )}
                  </div>
                );
              })}
           </div>

           <div className="mt-10 flex items-center justify-between px-2 flex-shrink-0 pt-6 border-t border-white/10">
              <button disabled={playlistPage === 0} onClick={() => setPlaylistPage(p => p - 1)} className="w-14 h-14 flex items-center justify-center rounded-[1.5rem] bg-white/5 text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-10 transition-all border border-white/5 shadow-xl"><i className="fa-solid fa-chevron-left"></i></button>
              <div className="flex flex-col items-center">
                 <span className="text-[12px] font-black tracking-[0.8em] text-white/40 uppercase">{playlistPage + 1} / {totalPages}</span>
                 <span className="text-[7px] font-bold text-indigo-400/30 uppercase tracking-[0.4em] mt-1">Digital Paging</span>
              </div>
              <button disabled={playlistPage >= totalPages - 1} onClick={() => setPlaylistPage(p => p + 1)} className="w-14 h-14 flex items-center justify-center rounded-[1.5rem] bg-white/5 text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-10 transition-all border border-white/5 shadow-xl"><i className="fa-solid fa-chevron-right"></i></button>
           </div>
        </div>
      )}
    </div>
  );
};

export default MusicPlayer;
