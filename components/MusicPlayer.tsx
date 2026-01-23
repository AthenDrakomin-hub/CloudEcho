
import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { Song, PlaybackMode } from '../types';
import { EMOTIONAL_QUOTES, BRAND_COLORS } from '../constants';
import { generateSoulQuote } from '../services/aiService';

interface LyricLine {
  time: number;
  text: string;
}

// 子组件：黑胶唱片，使用 React.memo 防止高频更新导致的重绘
const VinylDisk = memo(({ coverUrl, isPlaying, isFlipped, name, artist }: { coverUrl: string, isPlaying: boolean, isFlipped: boolean, name: string, artist: string }) => {
  return (
    <div className={`absolute inset-0 backface-hidden flex flex-col items-center justify-center glass-dark-morphism rounded-[4rem] md:rounded-[5.5rem] border border-white/10 shadow-[0_60px_120px_-20px_rgba(0,0,0,1)] p-8 md:p-12 group overflow-hidden ${isPlaying ? 'dj-pulse-active' : ''}`}>
      {/* 唱针动画 */}
      <div className="absolute top-0 right-1/4 w-32 h-40 z-50 transition-transform duration-1000 origin-top-right" style={{ transform: isPlaying ? 'rotate(15deg)' : 'rotate(-10deg)' }}>
         <div className="w-2 h-32 bg-gradient-to-b from-zinc-400 to-zinc-700 rounded-full shadow-2xl relative">
            <div className="absolute -bottom-4 -left-2 w-6 h-10 bg-zinc-900 rounded-lg border border-white/10 flex items-center justify-center">
               <div className="w-1 h-4 bg-white/20 rounded-full"></div>
            </div>
         </div>
      </div>

      {/* 唱片主体 */}
      <div className={`relative w-[70%] aspect-square rounded-full overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] border-[14px] border-zinc-950 transition-all duration-[3s] ${isPlaying ? 'rotate-[360deg] animate-[spin_20s_linear_infinite] ring-4 ring-red-500/20' : ''}`}>
        <img src={coverUrl} className="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 transition-all duration-1000" alt="Cover" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.8)_100%)]"></div>
        <div className="absolute inset-0 opacity-40 bg-[repeating-radial-gradient(circle_at_center,transparent,transparent_1px,rgba(255,255,255,0.05)_2px)]"></div>
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-12 h-12 bg-black/90 rounded-full border border-white/10 shadow-inner flex items-center justify-center">
              <div className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse shadow-[0_0_12px_#E60026]' : 'bg-white/20'}`}></div>
           </div>
        </div>
      </div>
      
      <div className="mt-8 text-center space-y-3 w-full px-6">
        <h2 className="text-2xl md:text-4xl font-black tracking-tighter italic truncate aurora-text drop-shadow-lg">{name}</h2>
        <div className="flex items-center justify-center space-x-3 opacity-30 group-hover:opacity-100 transition-opacity">
          <i className="fa-solid fa-compact-disc text-red-500 animate-spin-slow"></i>
          <p className="text-[10px] font-black text-white uppercase tracking-[0.5em]">{artist}</p>
        </div>
      </div>

      {/* 实时 DJ 频谱模拟 - 使用 CSS 动画而非 JS 随机数生成，极大减少布局抖动 */}
      <div className="absolute bottom-6 left-0 right-0 flex items-end justify-center space-x-1.5 h-8 px-16">
         {Array.from({length: 20}).map((_, i) => (
           <div key={i} className={`w-[3px] bg-gradient-to-t from-red-600 via-purple-500 to-indigo-500 rounded-full transition-all duration-300 ${isPlaying ? 'dj-bar-anim' : 'h-1.5 opacity-10'}`} style={{ animationDelay: `${i * 0.05}s`, height: `${10 + (i % 5) * 15}%` }}></div>
         ))}
      </div>
    </div>
  );
});

// 子组件：歌词显示
const LyricEngine = memo(({ parsedLyrics, activeLyricIndex, lyricsScrollRef }: { parsedLyrics: LyricLine[], activeLyricIndex: number, lyricsScrollRef: React.RefObject<HTMLDivElement | null> }) => {
  return (
    <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col glass-dark-morphism rounded-[4rem] md:rounded-[5.5rem] shadow-[0_60px_120px_-20px_rgba(0,0,0,1)] overflow-hidden p-10 border border-white/15">
       <div className="mb-8 flex items-center justify-between opacity-30">
         <span className="text-[10px] font-black uppercase tracking-[0.8em] text-red-500">子夜文字映射</span>
         <i className="fa-solid fa-bolt-lightning text-lg text-indigo-500 animate-pulse"></i>
       </div>
       
       <div ref={lyricsScrollRef} className="flex-1 overflow-y-auto no-scrollbar flex flex-col space-y-16 py-[20vh] px-4 scroll-smooth">
          {parsedLyrics.length > 0 ? (
            parsedLyrics.map((line, idx) => (
              <p key={idx} className={`text-xl md:text-4xl font-serif-quote font-black tracking-tight transition-all duration-700 text-center leading-relaxed ${activeLyricIndex === idx ? 'text-white scale-110 opacity-100 drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]' : 'text-white/5 opacity-10 blur-[2px]'}`}>{line.text}</p>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-12 opacity-10">
               <i className="fa-solid fa-atom text-6xl animate-spin-slow text-red-500"></i>
               <p className="text-[10px] font-black uppercase tracking-[1em] text-center italic">映射潜意识数据块...</p>
            </div>
          )}
       </div>
       <p className="mt-8 text-center text-[8px] font-black uppercase tracking-[0.8em] opacity-20 hover:opacity-100 transition-opacity cursor-pointer">返回中心</p>
    </div>
  );
});

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

const MusicPlayer: React.FC<MusicPlayerProps> = ({ 
  songs, currentIndex, onIndexChange, isPlaying, onTogglePlay, currentTime, duration, onSeek, audioRef, playbackMode, onModeChange
}) => {
  const lyricsScrollRef = useRef<HTMLDivElement>(null);
  const [activeQuote, setActiveQuote] = useState(EMOTIONAL_QUOTES[0].content);
  const [quoteKey, setQuoteKey] = useState(0); 
  const [volume, setVolume] = useState(0.8);
  const [isFlipped, setIsFlipped] = useState(false); 
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
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
      setQuoteKey(prev => prev + 1);
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
      
      {/* 顶部热评卡片 */}
      <header className="h-[25%] flex flex-col items-center justify-center z-[60] px-6 md:px-20 mt-4">
         <div 
          key={quoteKey} 
          onClick={handleMagicSpark} 
          className={`animate-[fadeIn_1.2s] group cursor-pointer transition-all duration-700 w-full max-w-2xl bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden ${isSoulLoading ? 'opacity-30 scale-95 blur-sm' : 'opacity-100 scale-100 hover:bg-white/[0.05]'}`}
         >
            <div className="flex items-center space-x-4 mb-6">
               <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-600 border border-white/20 flex items-center justify-center overflow-hidden">
                  <i className="fa-solid fa-user text-white/40"></i>
               </div>
               <div className="flex flex-col">
                  <span className="text-[11px] font-black text-white/80 tracking-widest uppercase italic">云村匿名映射者</span>
                  <span className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em] mt-1 italic">Atmosphere Trace System V4</span>
               </div>
               <div className="ml-auto flex items-center space-x-2 text-white/20 group-hover:text-pink-500/60 transition-colors">
                  <i className="fa-solid fa-heart text-[10px]"></i>
                  <span className="text-[9px] font-black tabular-nums">1.2w</span>
               </div>
            </div>
            
            <p className="text-xl md:text-2xl font-serif-quote font-black tracking-tight italic leading-relaxed text-white drop-shadow-md px-4 relative">
              {activeQuote}
            </p>
            
            <div className="mt-6 flex items-center justify-between">
               <div className="flex items-center space-x-3 opacity-20">
                  <span className="h-[1px] w-8 bg-indigo-500"></span>
                  <span className="text-[7px] font-black uppercase tracking-widest">子夜热评 · Night Echo</span>
               </div>
               <i className="fa-solid fa-sparkles text-indigo-400/40 text-sm group-hover:animate-pulse"></i>
            </div>
         </div>
      </header>

      {/* 核心展示区 */}
      <main className="h-[50%] flex flex-col items-center justify-center p-4 relative perspective-3000 z-50">
        <div 
          className={`relative w-full max-w-[360px] md:max-w-[480px] h-full transition-transform duration-[1.2s] cubic-bezier(0.15, 0.85, 0.15, 1) preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* 正面：沉浸黑胶 (已分离出 VinylDisk 子组件以优化性能) */}
          <VinylDisk 
            coverUrl={currentSong.coverUrl} 
            isPlaying={isPlaying} 
            isFlipped={isFlipped}
            name={currentSong.name}
            artist={currentSong.artist}
          />

          {/* 背面：歌词映射 (已分离出 LyricEngine 子组件) */}
          <LyricEngine 
            parsedLyrics={parsedLyrics}
            activeLyricIndex={activeLyricIndex}
            lyricsScrollRef={lyricsScrollRef}
          />
        </div>
      </main>

      {/* 底部控制中心 */}
      <footer className="h-[25%] flex flex-col items-center justify-center px-6 md:px-24 pb-8 z-[60]">
        
        {/* 进度流 */}
        <div className="w-full max-w-4xl flex items-center gap-6 md:gap-10 mb-8 group/prog">
          <span className="text-[10px] font-black text-white/20 tabular-nums w-12 text-center">{Math.floor(currentTime/60)}:{Math.floor(currentTime%60).toString().padStart(2,'0')}</span>
          <div className="flex-1 h-1.5 bg-white/5 rounded-full relative overflow-hidden group-hover/prog:h-2.5 transition-all duration-300 ring-1 ring-white/5">
            <input 
              type="range" min="0" max={duration || 0} step="0.1" 
              value={currentTime} onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 z-40 cursor-pointer"
            />
            <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-600 to-indigo-600 shadow-[0_0_20px_#E60026] transition-all duration-300" style={{ width: `${(currentTime/duration)*100}%` }}></div>
          </div>
          <span className="text-[10px] font-black text-white/20 tabular-nums w-12 text-center">{Math.floor(duration/60)}:{Math.floor(duration%60).toString().padStart(2,'0')}</span>
        </div>

        {/* 控制按钮 */}
        <div className="w-full max-w-6xl flex items-center justify-between">
          
          <div className="flex items-center space-x-6 md:space-x-10">
            <button 
              onClick={cyclePlaybackMode} 
              className={`w-12 h-12 flex items-center justify-center rounded-[1.5rem] transition-all ${playbackMode !== PlaybackMode.SEQUENCE ? 'bg-red-500/20 text-red-500 scale-110 shadow-lg' : 'text-white/20 hover:text-white'}`}
            >
              <i className={`fa-solid ${playbackMode === PlaybackMode.SHUFFLE ? 'fa-shuffle' : playbackMode === PlaybackMode.REPEAT_ONE ? 'fa-rotate-left' : 'fa-list-ol'} text-base md:text-lg`}></i>
            </button>
            <button 
              onClick={() => setShowPlaylist(!showPlaylist)}
              className={`w-12 h-12 flex items-center justify-center rounded-[1.5rem] transition-all ${showPlaylist ? 'bg-white text-black scale-110 shadow-2xl' : 'text-white/20 hover:text-white'}`}
            >
              <i className="fa-solid fa-bars-staggered text-base md:text-lg"></i>
            </button>
          </div>

          <div className="flex items-center gap-10 md:gap-16">
            <button onClick={() => onIndexChange((currentIndex - 1 + songs.length) % songs.length)} className="text-3xl text-white/10 hover:text-white transition-all hover:scale-125 hover:-rotate-12"><i className="fa-solid fa-backward-step"></i></button>
            <button 
              onClick={onTogglePlay} 
              className={`w-20 h-20 md:w-28 md:h-28 rounded-[2.5rem] md:rounded-[3.5rem] bg-white text-black flex items-center justify-center shadow-[0_30px_60px_-10px_rgba(255,255,255,0.3)] hover:scale-110 active:scale-95 transition-all group ${isPlaying ? 'ring-4 md:ring-8 ring-red-500/10' : ''}`}
            >
              <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play ml-1.5'} text-2xl md:text-4xl`}></i>
            </button>
            <button onClick={() => onIndexChange((currentIndex + 1) % songs.length)} className="text-3xl text-white/10 hover:text-white transition-all hover:scale-125 hover:rotate-12"><i className="fa-solid fa-forward-step"></i></button>
          </div>

          <div className="flex items-center space-x-6 md:space-x-10">
            <button 
              onClick={() => setShowShareModal(true)}
              className="w-12 h-12 flex items-center justify-center rounded-[1.5rem] text-pink-500 bg-pink-500/10 hover:bg-pink-500/30 transition-all border border-pink-500/20"
            >
              <i className="fa-solid fa-share-nodes text-lg"></i>
            </button>
            <div className="hidden lg:flex items-center space-x-4 bg-white/5 p-3 rounded-[1.2rem] border border-white/5">
              <i className="fa-solid fa-volume-high text-white/20 text-xs"></i>
              <div className="w-20 h-1 bg-white/10 rounded-full relative overflow-hidden">
                <input 
                  type="range" min="0" max="1" step="0.01" value={volume} 
                  onChange={(e) => { const v = parseFloat(e.target.value); setVolume(v); if(audioRef.current) audioRef.current.volume = v; }}
                  className="absolute inset-0 w-full h-full opacity-0 z-40 cursor-pointer"
                />
                <div className="absolute left-0 top-0 h-full bg-red-600" style={{ width: `${volume*100}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* 播放清单模态层 (保持原有逻辑) */}
      {showPlaylist && (
        <div className="absolute right-6 md:right-16 top-[10%] bottom-[10%] w-[320px] md:w-[420px] glass-dark-morphism rounded-[3.5rem] shadow-3xl z-[500] p-10 animate-[fadeIn_0.5s] border border-white/20 flex flex-col">
           <div className="flex items-center justify-between mb-10">
              <span className="text-[14px] font-black uppercase tracking-[0.8em] aurora-text">序列映射</span>
              <button onClick={() => setShowPlaylist(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/30 hover:text-white transition-all"><i className="fa-solid fa-xmark text-sm"></i></button>
           </div>
           
           <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pr-2">
              {paginatedPlaylist.map((s, idx) => {
                const globalIdx = playlistPage * PAGE_SIZE + idx;
                return (
                  <div key={s.id} onClick={() => onIndexChange(globalIdx)} className={`flex items-center space-x-6 p-4 rounded-[2rem] cursor-pointer transition-all ${currentIndex === globalIdx ? 'bg-red-500/20 border border-red-500/30 text-white scale-[1.05]' : 'hover:bg-white/5 text-white/30'}`}>
                    <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg border border-white/10">
                      <img src={s.coverUrl} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-black truncate ${currentIndex === globalIdx ? 'text-white' : 'text-white/60'}`}>{s.name}</p>
                      <p className="text-[9px] font-bold opacity-30 truncate tracking-widest mt-1 italic">{s.artist}</p>
                    </div>
                  </div>
                );
              })}
           </div>

           <div className="mt-10 flex items-center justify-between px-2 pt-6 border-t border-white/5">
              <button disabled={playlistPage === 0} onClick={() => setPlaylistPage(p => p - 1)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 text-white/20 hover:text-white disabled:opacity-5 transition-all"><i className="fa-solid fa-chevron-left"></i></button>
              <span className="text-[12px] font-black text-white/30 tracking-widest uppercase">{playlistPage + 1} / {totalPages}</span>
              <button disabled={playlistPage >= totalPages - 1} onClick={() => setPlaylistPage(p => p + 1)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 text-white/20 hover:text-white disabled:opacity-5 transition-all"><i className="fa-solid fa-chevron-right"></i></button>
           </div>
        </div>
      )}
    </div>
  );
};

export default MusicPlayer;
