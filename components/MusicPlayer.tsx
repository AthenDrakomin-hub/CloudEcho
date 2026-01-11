
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
      
      {/* 顶部情感投射：网易云评论墙风格 */}
      <header className="h-[30%] flex flex-col items-center justify-center z-[60] px-10 md:px-20">
         <div key={quoteKey} onClick={handleMagicSpark} className={`animate-[fadeIn_1.5s] text-center max-w-4xl cursor-pointer group transition-all duration-1000 ${isSoulLoading ? 'opacity-30 scale-95 blur-sm' : 'opacity-100 scale-100'}`}>
            <div className="flex items-center justify-center space-x-6 mb-6 opacity-40 group-hover:opacity-100 transition-opacity">
               <span className="h-[1px] w-16 bg-gradient-to-r from-transparent to-indigo-500"></span>
               <p className="text-[10px] font-black uppercase tracking-[1em] text-indigo-400"># 情感映射 · MOOD ECHO</p>
               <span className="h-[1px] w-16 bg-gradient-to-l from-transparent to-indigo-500"></span>
            </div>
            <p className="text-2xl md:text-4xl font-serif-quote font-black tracking-tight italic leading-relaxed text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)] px-6 relative">
              <span className="absolute -left-4 -top-4 text-6xl text-indigo-500/20 opacity-40 font-serif">“</span>
              {activeQuote}
              <span className="absolute -right-4 -bottom-4 text-6xl text-pink-500/20 opacity-40 font-serif">”</span>
            </p>
         </div>
      </header>

      {/* 核心展示区 */}
      <main className="h-[45%] flex flex-col items-center justify-center p-4 relative perspective-3000 z-50">
        <div 
          className={`relative w-full max-w-[360px] md:max-w-[480px] h-full transition-transform duration-[1.8s] cubic-bezier(0.15, 0.85, 0.15, 1) preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* 正面：沉浸黑胶 */}
          <div className={`absolute inset-0 backface-hidden flex flex-col items-center justify-center glass-dark-morphism rounded-[4rem] md:rounded-[5.5rem] border border-white/10 shadow-[0_80px_180px_-40px_rgba(0,0,0,1)] p-10 group overflow-hidden ${isPlaying ? 'dj-pulse-active' : ''}`}>
            
            {/* 极光背景装饰 */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/10 blur-[60px] rounded-full group-hover:bg-indigo-500/30 transition-all duration-1000"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-pink-500/10 blur-[80px] rounded-full group-hover:bg-pink-500/30 transition-all duration-1000"></div>

            {/* 唱片主体 */}
            <div className={`relative w-[75%] aspect-square rounded-full overflow-hidden shadow-[0_0_120px_rgba(0,0,0,1)] border-[16px] border-zinc-900 transition-all duration-[3s] ${isPlaying ? 'rotate-[360deg] animate-[spin_20s_linear_infinite] ring-8 ring-indigo-500/20' : ''}`}>
              <img src={currentSong.coverUrl} className="w-full h-full object-cover grayscale-[15%] group-hover:grayscale-0 transition-all duration-1000" alt="Cover" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.75)_100%)]"></div>
              {/* 黑胶细纹 */}
              <div className="absolute inset-0 opacity-30 bg-[repeating-radial-gradient(circle_at_center,transparent,transparent_1.5px,rgba(255,255,255,0.06)_2px)]"></div>
              {/* 中心装饰点 */}
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-14 h-14 bg-black/90 rounded-full border border-white/20 shadow-inner flex items-center justify-center">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(99,102,241,1)]"></div>
                 </div>
              </div>
            </div>
            
            <div className="mt-10 text-center space-y-4 w-full px-8">
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter italic truncate aurora-text drop-shadow-[0_4px_20px_rgba(0,0,0,1)]">{currentSong.name}</h2>
              <div className="flex items-center justify-center space-x-3 opacity-40 group-hover:opacity-100 transition-opacity">
                <i className="fa-solid fa-compact-disc text-indigo-400 animate-spin-slow"></i>
                <p className="text-[11px] font-black text-white uppercase tracking-[0.6em]">{currentSong.artist}</p>
              </div>
            </div>

            {/* 实时 DJ 频谱模拟 */}
            <div className="absolute bottom-8 left-0 right-0 flex items-end justify-center space-x-2 h-10 px-20">
               {Array.from({length: 24}).map((_, i) => (
                 <div key={i} className={`w-[4px] bg-gradient-to-t from-indigo-600 via-purple-500 to-pink-500 rounded-full transition-all duration-300 ${isPlaying ? 'dj-bar-anim' : 'h-2 opacity-10'}`} style={{ animationDelay: `${i * 0.04}s`, height: `${10 + Math.random() * 80}%` }}></div>
               ))}
            </div>
          </div>

          {/* 背面：深夜映画歌词 */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col glass-dark-morphism rounded-[4rem] md:rounded-[5.5rem] shadow-[0_80px_180px_-40px_rgba(0,0,0,1)] overflow-hidden p-12 border border-white/15">
             <div className="mb-10 flex items-center justify-between opacity-30">
               <div className="flex flex-col">
                  <span className="text-[11px] font-black uppercase tracking-[1em] text-indigo-400">子夜文字映射</span>
                  <span className="text-[8px] font-bold text-white/30 uppercase tracking-[0.4em] mt-2 italic">Atmosphere Trace System V4</span>
               </div>
               <div className="flex space-x-3">
                 <i className="fa-solid fa-moon text-xl text-indigo-500 animate-pulse"></i>
                 <i className="fa-solid fa-bolt-lightning text-xl text-pink-500 animate-pulse delay-75"></i>
               </div>
             </div>
             
             <div 
               ref={lyricsScrollRef}
               className="flex-1 overflow-y-auto no-scrollbar flex flex-col space-y-20 py-[25vh] px-4"
             >
                {parsedLyrics.length > 0 ? (
                  parsedLyrics.map((line, idx) => (
                    <p 
                      key={idx}
                      className={`text-2xl md:text-5xl font-serif-quote font-black tracking-tight transition-all duration-1000 text-center leading-relaxed ${
                        activeLyricIndex === idx 
                          ? 'text-white scale-110 opacity-100 drop-shadow-[0_0_40px_rgba(255,255,255,0.5)] translate-y-[-5px]' 
                          : 'text-white/5 opacity-10 blur-[3px]'
                      }`}
                    >
                      {line.text}
                    </p>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center space-y-16 opacity-15">
                     <i className="fa-solid fa-atom text-8xl animate-spin-slow text-indigo-500"></i>
                     <div className="text-center">
                        <p className="text-[12px] font-black uppercase tracking-[1.2em] italic text-indigo-500 mb-4">正在捕获情感轨迹...</p>
                        <p className="text-[8px] font-bold uppercase tracking-[0.5em] text-white/50 italic">Mapping subconscious data blocks</p>
                     </div>
                  </div>
                )}
             </div>
             <p className="mt-10 text-center text-[10px] font-black uppercase tracking-[1.2em] opacity-30 hover:opacity-100 transition-opacity cursor-pointer">点击返回终端中心</p>
          </div>
        </div>
      </main>

      {/* 底部控制中心 */}
      <footer className="h-[25%] flex flex-col items-center justify-center px-10 md:px-24 pb-12 z-[60]">
        
        {/* 极光进度流 */}
        <div className="w-full max-w-5xl flex items-center gap-10 mb-12 group/prog">
          <span className="text-[11px] font-black text-white/20 tabular-nums w-14 text-center">{Math.floor(currentTime/60)}:{Math.floor(currentTime%60).toString().padStart(2,'0')}</span>
          <div className="flex-1 h-2.5 bg-white/5 rounded-full relative overflow-hidden ring-1 ring-white/10 group-hover/prog:h-3.5 transition-all duration-500">
            <input 
              type="range" min="0" max={duration || 0} step="0.1" 
              value={currentTime} onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 z-40 cursor-pointer"
            />
            <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 shadow-[0_0_50px_rgba(99,102,241,1)] transition-all duration-300" style={{ width: `${(currentTime/duration)*100}%` }}></div>
            {/* 游标光点 */}
            <div className="absolute top-0 bottom-0 w-[4px] bg-white shadow-[0_0_20px_white] z-30" style={{ left: `${(currentTime/duration)*100}%` }}></div>
          </div>
          <span className="text-[11px] font-black text-white/20 tabular-nums w-14 text-center">{Math.floor(duration/60)}:{Math.floor(duration%60).toString().padStart(2,'0')}</span>
        </div>

        {/* 核心控制集 */}
        <div className="w-full max-w-6xl flex items-center justify-between">
          
          <div className="flex items-center space-x-10">
            <button 
              onClick={cyclePlaybackMode} 
              className={`w-14 h-14 flex items-center justify-center rounded-[2rem] transition-all duration-500 ${playbackMode !== PlaybackMode.SEQUENCE ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-2xl scale-110' : 'text-white/20 hover:text-white hover:bg-white/5'}`}
            >
              <i className={`fa-solid ${playbackMode === PlaybackMode.SHUFFLE ? 'fa-shuffle' : playbackMode === PlaybackMode.REPEAT_ONE ? 'fa-rotate-left' : 'fa-list-ol'} text-xl`}></i>
            </button>
            <button 
              onClick={() => setShowPlaylist(!showPlaylist)}
              className={`w-14 h-14 flex items-center justify-center rounded-[2rem] transition-all duration-500 ${showPlaylist ? 'bg-white text-black shadow-2xl scale-110' : 'text-white/20 hover:text-white hover:bg-white/5'}`}
            >
              <i className="fa-solid fa-bars-staggered text-xl"></i>
            </button>
          </div>

          <div className="flex items-center gap-14 md:gap-20">
            <button onClick={() => onIndexChange((currentIndex - 1 + songs.length) % songs.length)} className="text-4xl text-white/15 hover:text-white transition-all hover:scale-125 hover:rotate-[-12deg] active:scale-90"><i className="fa-solid fa-backward-step"></i></button>
            <button 
              onClick={onTogglePlay} 
              className={`w-24 h-24 md:w-32 md:h-32 rounded-[3.5rem] bg-white text-black flex items-center justify-center shadow-[0_50px_120px_-30px_rgba(255,255,255,0.4)] hover:scale-110 active:scale-90 transition-all group/play ${isPlaying ? 'ring-8 ring-indigo-500/10' : ''}`}
            >
              <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play ml-2'} text-3xl md:text-5xl transition-transform`}></i>
            </button>
            <button onClick={() => onIndexChange((currentIndex + 1) % songs.length)} className="text-4xl text-white/15 hover:text-white transition-all hover:scale-125 hover:rotate-[12deg] active:scale-90"><i className="fa-solid fa-forward-step"></i></button>
          </div>

          <div className="flex items-center space-x-10">
            <button 
              onClick={handleMagicSpark}
              className={`w-14 h-14 flex items-center justify-center rounded-[2rem] text-pink-400 bg-pink-400/10 hover:bg-pink-400/30 transition-all border border-pink-400/20 ${isSoulLoading ? 'animate-spin' : 'hover:scale-110'}`}
              title="刷新共鸣"
            >
              <i className={`fa-solid ${isSoulLoading ? 'fa-spinner' : 'fa-sparkles'} text-xl`}></i>
            </button>
            <div className="hidden lg:flex items-center space-x-6 bg-white/5 p-4 rounded-[1.8rem] border border-white/5 group/vol shadow-xl">
              <i className="fa-solid fa-volume-high text-white/20 group-hover/vol:text-indigo-400 transition-colors text-sm"></i>
              <div className="w-24 h-2 bg-white/10 rounded-full relative overflow-hidden">
                <input 
                  type="range" min="0" max="1" step="0.01" value={volume} 
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    if(audioRef.current) audioRef.current.volume = v;
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 z-40 cursor-pointer"
                />
                <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-500 to-pink-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ width: `${volume*100}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* 播放清单模态层 */}
      {showPlaylist && (
        <div className="absolute right-8 md:right-20 top-[12%] bottom-[12%] w-[360px] md:w-[480px] glass-dark-morphism rounded-[4.5rem] shadow-[0_150px_350px_-80px_rgba(0,0,0,1)] z-[500] p-14 animate-[fadeIn_0.6s] border border-white/25 ring-1 ring-white/10 flex flex-col">
           <div className="flex items-center justify-between mb-14 flex-shrink-0">
              <div className="flex flex-col">
                 <h4 className="text-[18px] font-black uppercase tracking-[1em] aurora-text italic">序列映射</h4>
                 <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em] mt-3 italic leading-none">DIGITAL AUDIO SEQUENCE V4.2</span>
              </div>
              <button onClick={() => setShowPlaylist(false)} className="w-14 h-14 flex items-center justify-center rounded-full bg-white/5 text-white/30 hover:text-white hover:bg-white/10 transition-all border border-white/15 shadow-2xl"><i className="fa-solid fa-xmark"></i></button>
           </div>
           
           <div className="flex-1 overflow-y-auto no-scrollbar space-y-8 pr-2">
              {paginatedPlaylist.map((s, idx) => {
                const globalIdx = playlistPage * PAGE_SIZE + idx;
                return (
                  <div 
                    key={s.id} 
                    onClick={() => onIndexChange(globalIdx)}
                    className={`flex items-center space-x-8 p-6 rounded-[3rem] cursor-pointer transition-all border ${currentIndex === globalIdx ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-100 scale-[1.08] shadow-3xl' : 'hover:bg-white/5 border-transparent text-white/20'}`}
                  >
                    <div className="w-18 h-18 rounded-[1.5rem] overflow-hidden flex-shrink-0 shadow-[0_15px_30px_rgba(0,0,0,0.6)] border border-white/10 ring-1 ring-white/5">
                      <img src={s.coverUrl} className="w-full h-full object-cover grayscale-[20%] transition-all" alt="" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[15px] font-black truncate ${currentIndex === globalIdx ? 'text-white' : 'text-white/70'}`}>{s.name}</p>
                      <div className="flex items-center space-x-3 mt-2">
                        <span className="w-3 h-[1px] bg-white/20"></span>
                        <p className="text-[10px] font-bold uppercase opacity-30 truncate tracking-[0.2em] italic">{s.artist}</p>
                      </div>
                    </div>
                    {currentIndex === globalIdx && (
                      <div className="flex items-end space-x-2 h-5 px-3">
                         <div className="w-[4px] bg-indigo-500 rounded-full animate-[dj-bar_0.4s_ease-in-out_infinite_alternate]"></div>
                         <div className="w-[4px] bg-indigo-500 rounded-full animate-[dj-bar_0.6s_ease-in-out_infinite_alternate_0.2s]"></div>
                         <div className="w-[4px] bg-indigo-500 rounded-full animate-[dj-bar_0.5s_ease-in-out_infinite_alternate_0.4s]"></div>
                      </div>
                    )}
                  </div>
                );
              })}
           </div>

           <div className="mt-14 flex items-center justify-between px-4 pt-10 border-t border-white/10">
              <button disabled={playlistPage === 0} onClick={() => setPlaylistPage(p => p - 1)} className="w-16 h-16 flex items-center justify-center rounded-[2.2rem] bg-white/5 text-white/30 hover:text-white hover:bg-white/10 disabled:opacity-5 transition-all shadow-xl"><i className="fa-solid fa-chevron-left"></i></button>
              <div className="flex flex-col items-center">
                <span className="text-[16px] font-black tracking-[1.2em] text-white/40 uppercase">{playlistPage + 1} / {totalPages}</span>
                <span className="text-[8px] font-bold text-white/10 uppercase tracking-[0.4em] mt-2 italic">PAGE MAPPING</span>
              </div>
              <button disabled={playlistPage >= totalPages - 1} onClick={() => setPlaylistPage(p => p + 1)} className="w-16 h-16 flex items-center justify-center rounded-[2.2rem] bg-white/5 text-white/30 hover:text-white hover:bg-white/10 disabled:opacity-5 transition-all shadow-xl"><i className="fa-solid fa-chevron-right"></i></button>
           </div>
        </div>
      )}
    </div>
  );
};

export default MusicPlayer;
