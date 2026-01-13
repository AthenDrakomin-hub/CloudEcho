
import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { Song, PlaybackMode } from '../types';
import { EMOTIONAL_QUOTES } from '../constants';
import { generateSoulQuote } from '../services/aiService';
import { fetchLyricsOnline } from '../services/discoveryService';

const VinylDisk = memo(({ coverUrl, isPlaying, name, artist }: { coverUrl: string, isPlaying: boolean, name: string, artist: string }) => {
  return (
    <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center glass-dark-morphism rounded-[2.5rem] md:rounded-[5rem] p-6 md:p-12 overflow-hidden border border-white/20 shadow-2xl">
      {/* 唱片主体 - 优化尺寸适配 */}
      <div className={`relative w-[65%] md:w-[60%] aspect-square rounded-full overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,1)] border-[8px] md:border-[16px] border-zinc-900 transition-transform duration-[10s] ${isPlaying ? 'animate-[spin_20s_linear_infinite] ring-4 ring-red-500/20' : 'ring-2 ring-white/5'}`}>
        <img src={coverUrl} className="w-full h-full object-cover" alt="Cover" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.8)_100%)]"></div>
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'repeating-radial-gradient(circle, transparent 0, transparent 1px, rgba(255,255,255,0.03) 2px)' }}></div>
      </div>
      
      {/* 歌曲信息 */}
      <div className="mt-6 md:mt-10 text-center space-y-2 md:space-y-4 w-full px-4 z-10">
        <h2 className="text-xl md:text-3xl font-black tracking-tighter italic truncate text-white drop-shadow-lg">{name}</h2>
        <div className="flex items-center justify-center space-x-2">
           <span className="w-4 h-[1px] bg-white/20"></span>
           <p className="text-[10px] md:text-[12px] font-black text-red-500/80 uppercase tracking-[0.2em]">{artist}</p>
           <span className="w-4 h-[1px] bg-white/20"></span>
        </div>
      </div>

      {/* 底部频谱 - 缩小高度 */}
      <div className="absolute bottom-6 left-0 right-0 flex items-end justify-center space-x-1 h-8">
         {Array.from({length: 12}).map((_, i) => (
           <div key={i} className={`w-[4px] bg-gradient-to-t from-red-600 to-indigo-500 rounded-full transition-all duration-300 ${isPlaying ? 'dj-bar-anim' : 'h-1 opacity-10'}`} style={{ animationDelay: `${i * 0.1}s`, height: isPlaying ? `${20 + (i % 5) * 20}%` : '4px' }}></div>
         ))}
      </div>
    </div>
  );
});

const LyricEngine = memo(({ parsedLyrics, activeLyricIndex, lyricsScrollRef }: { parsedLyrics: any[], activeLyricIndex: number, lyricsScrollRef: React.RefObject<HTMLDivElement | null> }) => {
  return (
    <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col glass-dark-morphism rounded-[2.5rem] md:rounded-[5rem] overflow-hidden p-6 md:p-14 border border-white/20">
       <div ref={lyricsScrollRef} className="flex-1 overflow-y-auto no-scrollbar flex flex-col space-y-12 py-[25vh] scroll-smooth">
          {parsedLyrics.length > 0 ? (
            parsedLyrics.map((line, idx) => (
              <p 
                key={idx} 
                className={`text-lg md:text-2xl font-serif-quote font-black tracking-tight transition-all duration-500 text-center leading-relaxed px-4 ${
                  activeLyricIndex === idx 
                  ? 'text-white scale-105 opacity-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]' 
                  : 'text-white/20 opacity-30 scale-95'
                }`}
              >
                {line.text}
              </p>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
               <i className="fa-solid fa-compact-disc animate-spin text-white/10 text-4xl"></i>
               <p className="italic text-[10px] tracking-widest uppercase text-white/30 font-black">正在读取情感记忆...</p>
            </div>
          )}
       </div>
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
  volume: number;
  onVolumeChange: (vol: number) => void;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ 
  songs, currentIndex, onIndexChange, isPlaying, onTogglePlay, currentTime, duration, onSeek, audioRef, playbackMode, onModeChange, volume, onVolumeChange
}) => {
  const lyricsScrollRef = useRef<HTMLDivElement>(null);
  const [activeQuote, setActiveQuote] = useState(EMOTIONAL_QUOTES[0].content);
  const [isFlipped, setIsFlipped] = useState(false); 
  const [isSoulLoading, setIsSoulLoading] = useState(false);
  const [dynamicLyrics, setDynamicLyrics] = useState<string | null>(null);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  const currentSong = songs[currentIndex];

  useEffect(() => {
    setDynamicLyrics(null);
    if (currentSong) {
      if (currentSong.lyrics) setDynamicLyrics(currentSong.lyrics);
      else fetchLyricsOnline(currentSong.artist, currentSong.name).then(lyric => lyric && setDynamicLyrics(lyric));
    }
  }, [currentIndex, currentSong]);

  const handleSoulRefresh = async () => {
    if (isSoulLoading || !currentSong) return;
    setIsSoulLoading(true);
    try {
      const quote = await generateSoulQuote(currentSong.name, currentSong.artist);
      setActiveQuote(quote);
    } catch (e) {
      setActiveQuote(EMOTIONAL_QUOTES[Math.floor(Math.random()*EMOTIONAL_QUOTES.length)].content);
    } finally { setIsSoulLoading(false); }
  };

  const parsedLyrics = useMemo(() => {
    const raw = dynamicLyrics || currentSong?.lyrics;
    if (!raw) return [];
    return raw.split('\n').map(line => {
      const match = line.match(/\[(\d{2,3}):(\d{2}(?:\.\d+)?)\]/);
      if (match) return { time: parseInt(match[1])*60 + parseFloat(match[2]), text: line.replace(/\[\d{2,3}:\d{2}(?:\.\d+)?\]/, '').trim() };
      return { time: -1, text: line.trim() };
    }).filter(l => l.text !== '').sort((a, b) => a.time - b.time);
  }, [dynamicLyrics, currentSong?.lyrics]);

  const activeLyricIndex = useMemo(() => {
    if (parsedLyrics.length === 0) return -1;
    for (let i = parsedLyrics.length - 1; i >= 0; i--) { if (currentTime >= parsedLyrics[i].time && parsedLyrics[i].time !== -1) return i; }
    return 0;
  }, [currentTime, parsedLyrics]);

  useEffect(() => {
    if (lyricsScrollRef.current && activeLyricIndex !== -1) {
      const container = lyricsScrollRef.current;
      const activeEl = container.children[activeLyricIndex] as HTMLElement;
      if (activeEl) {
        const offset = activeEl.offsetTop - container.offsetHeight / 2 + activeEl.offsetHeight / 2;
        container.scrollTo({ top: offset, behavior: 'smooth' });
      }
    }
  }, [activeLyricIndex]);

  const cyclePlaybackMode = () => {
    const modes = [PlaybackMode.SEQUENCE, PlaybackMode.SHUFFLE, PlaybackMode.REPEAT_ONE];
    const nextIdx = (modes.indexOf(playbackMode) + 1) % modes.length;
    onModeChange(modes[nextIdx]);
  };

  const getModeIcon = () => {
    switch(playbackMode) {
      case PlaybackMode.SHUFFLE: return { icon: 'fa-shuffle', label: '随机' };
      case PlaybackMode.REPEAT_ONE: return { icon: 'fa-repeat', label: '单曲' };
      default: return { icon: 'fa-arrow-right-long', label: '列表' };
    }
  };

  if (!currentSong) return (
    <div className="flex-1 flex items-center justify-center">
       <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-white/10 border-t-red-500 rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30">信号搜索中...</p>
       </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col relative select-none bg-transparent text-white px-4 md:px-0 h-full overflow-hidden">
      
      {/* 实时播放列表抽屉 */}
      <div className={`fixed right-0 md:right-6 top-0 md:top-24 bottom-0 md:bottom-24 w-full md:w-80 glass-dark-morphism md:rounded-[3rem] z-[2000] border-l md:border border-white/20 shadow-2xl transition-all duration-500 flex flex-col overflow-hidden ${isQueueOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-8 border-b border-white/10 flex items-center justify-between bg-black/40">
           <h3 className="font-black text-xs uppercase tracking-widest italic text-red-500">播放队列</h3>
           <button onClick={() => setIsQueueOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
             <i className="fa-solid fa-xmark"></i>
           </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-2 bg-black/20">
           {songs.map((s, idx) => (
             <div 
              key={s.id} onClick={() => { onIndexChange(idx); setIsQueueOpen(false); }}
              className={`flex items-center p-3 rounded-2xl transition-all cursor-pointer group border ${currentIndex === idx ? 'bg-red-600/20 border-red-500/50 text-white' : 'hover:bg-white/5 border-transparent text-white/50'}`}
             >
                <img src={s.coverUrl} className="w-10 h-10 rounded-lg mr-4 object-cover shadow-lg" alt="" />
                <div className="flex-1 truncate">
                  <p className="text-[11px] font-black truncate">{s.name}</p>
                  <p className="text-[8px] font-bold uppercase opacity-40 truncate mt-0.5">{s.artist}</p>
                </div>
                {currentIndex === idx && <i className="fa-solid fa-waveform-lines text-red-500 animate-pulse text-[10px]"></i>}
             </div>
           ))}
        </div>
      </div>

      {/* 顶部文案区 - 优化高度 */}
      <header className="flex-none pt-12 md:pt-20 pb-4 flex flex-col items-center justify-center z-[60]">
         <div onClick={handleSoulRefresh} className={`max-w-xl w-full mx-auto bg-black/40 border border-white/10 rounded-2xl p-4 md:p-6 backdrop-blur-xl transition-all hover:bg-black/60 cursor-pointer shadow-xl active:scale-95 ${isSoulLoading ? 'opacity-40 blur-sm' : 'opacity-100'}`}>
            <p className="text-sm md:text-lg font-serif-quote font-black italic tracking-tight leading-relaxed text-white/90 text-center drop-shadow-md">
              {activeQuote}
            </p>
         </div>
      </header>

      {/* 核心唱片/歌词展示区 - 使用 flex-1 占据剩余空间 */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-50 overflow-hidden">
        <div 
          className={`relative w-full max-w-[280px] md:max-w-[480px] aspect-square transition-transform duration-[0.8s] preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`} 
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <VinylDisk coverUrl={currentSong.coverUrl} isPlaying={isPlaying} name={currentSong.name} artist={currentSong.artist} />
          <LyricEngine parsedLyrics={parsedLyrics} activeLyricIndex={activeLyricIndex} lyricsScrollRef={lyricsScrollRef} />
        </div>
        <div className="mt-4 md:mt-8 opacity-20 flex items-center gap-2">
           <i className="fa-solid fa-arrows-left-right text-[8px]"></i>
           <span className="text-[8px] font-black uppercase tracking-[0.3em]">点击唱片切换歌词</span>
        </div>
      </main>

      {/* 底部控制中心 - 采用固定/自适应高度 */}
      <footer className="flex-none flex flex-col items-center justify-end px-4 md:px-6 pb-8 md:pb-12 z-[60] space-y-6 md:space-y-8">
        
        {/* 功能行 */}
        <div className="w-full max-w-lg flex items-center justify-between px-2">
           <button onClick={cyclePlaybackMode} className="flex flex-col items-center gap-1.5 text-white/40 hover:text-white transition-all">
              <i className={`fa-solid ${getModeIcon().icon} text-base`}></i>
              <span className="text-[7px] font-black uppercase tracking-tighter">{getModeIcon().label}</span>
           </button>

           <div className="flex items-center space-x-3 w-24 md:w-32 bg-white/5 px-3 py-2 rounded-full border border-white/10 group">
              <i className={`fa-solid ${volume === 0 ? 'fa-volume-xmark text-red-500' : 'fa-volume-low text-white/30'} text-xs`}></i>
              <div className="flex-1 h-0.5 bg-white/10 rounded-full relative cursor-pointer">
                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => onVolumeChange(parseFloat(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 z-40 cursor-pointer" />
                <div className="absolute left-0 top-0 h-full bg-red-500 rounded-full" style={{ width: `${volume*100}%` }}></div>
              </div>
           </div>

           <div className="flex items-center gap-6">
              <button onClick={() => setIsQueueOpen(true)} className="flex flex-col items-center gap-1.5 text-white/40 hover:text-white transition-all">
                <i className="fa-solid fa-list-ul text-base"></i>
                <span className="text-[7px] font-black uppercase tracking-tighter">队列</span>
              </button>
           </div>
        </div>

        {/* 进度条 */}
        <div className="w-full max-w-lg flex items-center gap-4">
          <span className="text-[9px] font-black text-white/20 tabular-nums w-8 text-right">{Math.floor(currentTime/60)}:{(currentTime%60).toFixed(0).padStart(2,'0')}</span>
          <div className="flex-1 h-1 bg-white/5 rounded-full relative group/prog">
            <input type="range" min="0" max={duration || 0} step="0.1" value={currentTime} onChange={(e) => onSeek(parseFloat(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 z-40 cursor-pointer" />
            <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-600 to-indigo-600 rounded-full" style={{ width: `${(currentTime/duration)*100}%` }}></div>
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover/prog:opacity-100 transition-opacity" style={{ left: `${(currentTime/duration)*100}%`, marginLeft: '-6px' }}></div>
          </div>
          <span className="text-[9px] font-black text-white/20 tabular-nums w-8">{duration ? `${Math.floor(duration/60)}:${(duration%60).toFixed(0).padStart(2,'0')}` : '0:00'}</span>
        </div>

        {/* 主按钮 */}
        <div className="flex items-center gap-10 md:gap-16">
          <button onClick={() => onIndexChange((currentIndex-1+songs.length)%songs.length)} className="text-2xl text-white/30 hover:text-white active:scale-75 transition-all"><i className="fa-solid fa-backward-step"></i></button>
          <button onClick={onTogglePlay} className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white text-black flex items-center justify-center shadow-[0_10px_40px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-90 transition-all ring-4 ring-white/10">
            <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play ml-1'} text-2xl md:text-3xl`}></i>
          </button>
          <button onClick={() => onIndexChange((currentIndex+1)%songs.length)} className="text-2xl text-white/30 hover:text-white active:scale-75 transition-all"><i className="fa-solid fa-forward-step"></i></button>
        </div>
      </footer>
    </div>
  );
};

export default MusicPlayer;
