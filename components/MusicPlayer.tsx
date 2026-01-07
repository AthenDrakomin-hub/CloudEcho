
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Song, PlaybackMode } from '../types';
import { EMOTIONAL_QUOTES, DEFAULT_COVERS } from '../constants';

interface MusicPlayerProps {
  songs: Song[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  shared?: boolean;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  playbackMode: PlaybackMode;
  onModeChange: (mode: PlaybackMode) => void;
  volume: number;
  onVolumeChange: (v: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  ambientRain: number;
  onAmbientRainChange: (v: number) => void;
  ambientStatic: number;
  onAmbientStaticChange: (v: number) => void;
  sleepTimer: number | null;
  onSleepTimerChange: (v: number | null) => void;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ 
  songs, currentIndex, onIndexChange, shared = false,
  isPlaying, onTogglePlay, currentTime, duration, onSeek, audioRef,
  playbackMode, onModeChange, volume, onVolumeChange, isMuted, onToggleMute,
  ambientRain, onAmbientRainChange, ambientStatic, onAmbientStaticChange,
  sleepTimer, onSleepTimerChange
}) => {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [customCover, setCustomCover] = useState<string | null>(null);
  const [showFullQueue, setShowFullQueue] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [showToolbox, setShowToolbox] = useState(false);
  const [isPureMode, setIsPureMode] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const volumeTimerRef = useRef<number | null>(null);

  const currentSong = songs[currentIndex];

  const nextUp = useMemo(() => {
    if (songs.length <= 1) return [];
    const queue = [];
    for (let i = 1; i <= 3; i++) {
      const idx = (currentIndex + i) % songs.length;
      if (idx !== currentIndex) queue.push({ song: songs[idx], idx });
    }
    return queue;
  }, [currentIndex, songs]);

  useEffect(() => {
    setQuoteIndex(Math.floor(Math.random() * EMOTIONAL_QUOTES.length));
    const randomCover = DEFAULT_COVERS[Math.floor(Math.random() * DEFAULT_COVERS.length)];
    setCustomCover(randomCover);
  }, [currentIndex]);

  const handleVolumeEnter = () => {
    if (volumeTimerRef.current) window.clearTimeout(volumeTimerRef.current);
    setShowVolume(true);
  };

  const handleVolumeLeave = () => {
    volumeTimerRef.current = window.setTimeout(() => {
      setShowVolume(false);
    }, 1200); // 增加延时，防止误触关闭
  };

  const getModeIcon = () => {
    switch (playbackMode) {
      case PlaybackMode.SHUFFLE: return 'fa-shuffle';
      case PlaybackMode.REPEAT_ONE: return 'fa-repeat text-red-500';
      default: return 'fa-repeat';
    }
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return 'fa-volume-xmark';
    if (volume < 0.3) return 'fa-volume-off';
    if (volume < 0.7) return 'fa-volume-low';
    return 'fa-volume-high';
  };

  useEffect(() => {
    if (!canvasRef.current || !audioRef.current || !containerRef.current) return;
    
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
      if (!analyserRef.current && audioRef.current) {
        try {
          const analyser = audioContextRef.current.createAnalyser();
          const source = audioContextRef.current.createMediaElementSource(audioRef.current);
          source.connect(analyser);
          analyser.connect(audioContextRef.current.destination);
          analyserRef.current = analyser;
        } catch (e) {}
      }
    };

    if (isPlaying) initAudio();

    const analyser = analyserRef.current;
    if (!analyser) return;

    analyser.fftSize = 128;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const ctx = canvasRef.current.getContext('2d')!;

    let hue = 220; 

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for(let i = 0; i < 20; i++) sum += dataArray[i];
      const avg = sum / 20;
      const intensity = Math.pow(avg / 255, 2);
      
      if (containerRef.current) {
        hue = (220 + (intensity * 140)) % 360; 
        containerRef.current.style.setProperty('--beat-intensity', intensity.toString());
        containerRef.current.style.setProperty('--beat-hue', `${hue}deg`);
        containerRef.current.style.setProperty('--beat-scale', (1 + intensity * 0.04).toString());
      }

      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      const centerX = canvasRef.current!.width / 2;
      const centerY = canvasRef.current!.height / 2;
      const radius = isPureMode ? 140 : (window.innerWidth < 768 ? 50 : 110);

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * (isPureMode ? 80 : (window.innerWidth < 768 ? 18 : 45));
        const angle = (i * 2 * Math.PI) / bufferLength;
        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius + barHeight);

        ctx.strokeStyle = `hsla(${hue}, 70%, 50%, ${0.1 + (dataArray[i] / 255) * 0.7})`;
        ctx.lineWidth = isPureMode ? 4 : 2 + intensity * 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    };
    
    draw();
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [isPlaying, currentSong, isPureMode]);

  if (!currentSong) return null;

  return (
    <div 
      ref={containerRef}
      className={`flex-1 flex flex-col relative h-full min-h-0 overflow-hidden bg-[#020202] transition-all duration-1000 ${isPureMode ? 'cursor-none' : ''}`}
      onDoubleClick={() => setIsPureMode(!isPureMode)}
      style={{ 
        '--beat-intensity': '0',
        '--beat-hue': '220deg',
        '--beat-scale': '1'
      } as React.CSSProperties}
    >
      <div className="absolute inset-0 -z-10 transition-all duration-700 pointer-events-none overflow-hidden">
        <div 
          className="absolute inset-0 opacity-[0.12] blur-[140px] scale-150 transition-transform duration-500"
          style={{ 
            backgroundImage: `url(${customCover || currentSong.coverUrl})`, 
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: `hue-rotate(var(--beat-hue)) saturate(calc(0.8 + var(--beat-intensity)))`,
            transform: `scale(calc(1.1 + var(--beat-intensity) * 0.2))`
          }}
        ></div>
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full mix-blend-overlay opacity-30 blur-[150px] transition-all duration-75"
          style={{ 
            background: `radial-gradient(circle, hsla(var(--beat-hue), 80%, 50%, 0.6) 0%, transparent 70%)`,
            transform: `translate(-50%, -50%) scale(calc(0.5 + var(--beat-intensity) * 2))`
          }}
        ></div>
      </div>

      {isPureMode && (
        <div className="absolute top-10 left-10 text-[10px] text-zinc-800 font-black uppercase tracking-widest animate-pulse z-[150]">
          双击返回主界面
        </div>
      )}

      <div className={`flex-1 flex flex-col items-center justify-center min-h-0 p-4 relative transition-all duration-700 ${isPureMode ? 'scale-110' : ''}`}>
        <div 
          className={`relative cursor-pointer flex items-center justify-center transition-transform duration-75 ${isPureMode ? 'mb-0' : 'mb-6 md:mb-14'}`}
          style={{ transform: `scale(var(--beat-scale))` }}
          onClick={onTogglePlay}
        >
          <canvas 
            ref={canvasRef} 
            width={isPureMode ? 600 : (window.innerWidth < 768 ? 260 : 460)} 
            height={isPureMode ? 600 : (window.innerWidth < 768 ? 260 : 460)} 
            className="absolute z-0 opacity-50 pointer-events-none" 
          />
          
          <div 
            className={`relative rounded-full border-[#080808] vinyl-border flex items-center justify-center z-10 overflow-hidden ring-1 ring-white/5 transition-all duration-700 ${isPureMode ? 'w-0 h-0 opacity-0' : 'w-32 h-32 sm:w-44 sm:h-44 md:w-60 md:h-60 lg:w-72 lg:h-72 border-[8px] md:border-[15px]'}`}
            style={{ 
              boxShadow: `0 0 calc(30px + var(--beat-intensity) * 80px) hsla(var(--beat-hue), 80%, 50%, calc(0.15 + var(--beat-intensity) * 0.45))`,
            }}
          >
            <div className={`w-full h-full p-6 md:p-12 ${isPlaying ? 'animate-spin-slow' : 'animate-spin-slow animate-spin-paused'}`}>
              <div className="w-full h-full rounded-full bg-cover bg-center border-[2px] border-black/50 shadow-2xl relative overflow-hidden" style={{ backgroundImage: `url(${customCover || currentSong.coverUrl})` }}>
                 <div className="absolute inset-0 bg-[radial-gradient(circle,_transparent_50%,_rgba(0,0,0,0.6)_100%)]"></div>
              </div>
            </div>
          </div>

          {isPureMode && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 px-6 sm:px-12 text-center space-y-6 sm:space-y-10 animate-in zoom-in duration-1000 max-w-full">
               <h3 className="text-2xl sm:text-3xl md:text-5xl font-black italic tracking-tighter text-white drop-shadow-2xl line-clamp-4 break-words leading-[1.2]">
                 “{EMOTIONAL_QUOTES[quoteIndex]?.content}”
               </h3>
               <div className="space-y-3 opacity-40">
                  <div className="h-[1px] w-12 bg-white/30 mx-auto"></div>
                  <p className="text-lg sm:text-xl font-bold tracking-[0.3em] uppercase truncate max-w-xs">{currentSong.name}</p>
                  <p className="text-[10px] uppercase tracking-[0.6em] truncate max-w-xs">{currentSong.artist}</p>
               </div>
            </div>
          )}
        </div>

        <div className={`w-full max-w-md text-center z-10 flex flex-col space-y-6 md:space-y-8 transition-all duration-500 ${isPureMode ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100'}`}>
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-1000 px-4">
            <h2 className="text-xl md:text-4xl font-black text-white tracking-tighter truncate italic" style={{ textShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>{currentSong.name}</h2>
            <p className="font-bold uppercase tracking-[0.6em] text-[8px] md:text-[10px] mt-2 opacity-60 truncate" style={{ color: `hsla(var(--beat-hue), 60%, 70%, 1)` }}>{currentSong.artist}</p>
          </div>
          
          <div className="px-6 sm:px-8 space-y-5">
            <div className="flex items-center space-x-3 group/progress-container">
              <span className="text-[8px] text-zinc-700 font-mono w-8 text-right shrink-0">{Math.floor(currentTime/60)}:{Math.floor(currentTime%60).toString().padStart(2,'0')}</span>
              <div className="flex-1 h-2 bg-white/5 rounded-full relative min-w-0">
                <input 
                  type="range" min="0" max={duration || 0} step="0.1" 
                  value={currentTime} 
                  onChange={(e)=> onSeek(parseFloat(e.target.value))} 
                  className="absolute inset-0 w-full h-full opacity-0 z-30 cursor-pointer" 
                />
                <div 
                  className="absolute left-0 top-0 h-full rounded-full transition-all duration-75 z-20 pointer-events-none" 
                  style={{ 
                    width: `${(currentTime / duration) * 100 || 0}%`,
                    backgroundColor: `hsla(var(--beat-hue), 70%, 50%, 1)`,
                    boxShadow: `0 0 12px hsla(var(--beat-hue), 70%, 50%, 0.8)`
                  }}
                ></div>
              </div>
              <span className="text-[8px] text-zinc-700 font-mono w-8 text-left shrink-0">{Math.floor(duration/60)}:{Math.floor(duration%60).toString().padStart(2,'0')}</span>
            </div>

            <div className="flex items-center justify-center space-x-4 md:space-x-8">
              <button onClick={() => onModeChange(playbackMode === PlaybackMode.SHUFFLE ? PlaybackMode.SEQUENCE : playbackMode === PlaybackMode.SEQUENCE ? PlaybackMode.REPEAT_ONE : PlaybackMode.SHUFFLE)} className="text-zinc-700 hover:text-white transition-all shrink-0">
                <i className={`fa-solid ${getModeIcon()} text-[10px] md:text-xs`}></i>
              </button>
              <button onClick={() => onIndexChange((currentIndex - 1 + songs.length) % songs.length)} className="text-zinc-500 hover:text-white text-xl md:text-3xl active:scale-75 transition-all shrink-0"><i className="fa-solid fa-backward-step"></i></button>
              <button onClick={onTogglePlay} className="w-14 h-14 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center text-black shadow-[0_20px_50px_rgba(255,255,255,0.1)] active:scale-90 transition-all shrink-0">
                <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play ml-1'} text-xl md:text-4xl`}></i>
              </button>
              <button onClick={() => onIndexChange((currentIndex + 1) % songs.length)} className="text-zinc-500 hover:text-white text-xl md:text-3xl active:scale-75 transition-all shrink-0"><i className="fa-solid fa-forward-step"></i></button>
              
              {/* 音量控制 - 极高灵敏度版本 */}
              <div 
                className="flex items-center space-x-2 relative shrink-0"
                onMouseEnter={handleVolumeEnter}
                onMouseLeave={handleVolumeLeave}
              >
                <button 
                  onClick={() => setShowVolume(!showVolume)} 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${showVolume ? 'bg-white/10 text-white shadow-lg' : 'text-zinc-700 hover:text-white'}`}
                >
                  <i className={`fa-solid ${getVolumeIcon()} text-[12px] md:text-sm`}></i>
                </button>
                {showVolume && (
                  <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 bg-[#0a0a0a] border border-white/10 p-5 rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] flex flex-col items-center space-y-4 z-50 animate-in zoom-in-95 duration-200">
                    <div className="h-40 w-12 relative flex flex-col items-center group/slider">
                       <input 
                        type="range" min="0" max="1" step="0.01" 
                        value={isMuted ? 0 : volume} 
                        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                        className="w-40 h-2 bg-white/5 accent-red-600 cursor-pointer absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 origin-center"
                       />
                    </div>
                    <span className="text-[11px] font-mono font-black text-white bg-white/5 px-3 py-1 rounded-full">{Math.round(volume * 100)}%</span>
                  </div>
                )}
                <button onClick={onToggleMute} className="hidden lg:flex text-zinc-800 hover:text-zinc-600 text-[8px] absolute -bottom-5 left-1/2 -translate-x-1/2 font-black uppercase tracking-tighter transition-colors">Quick Mute</button>
              </div>

              <button onClick={() => setShowFullQueue(true)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${showFullQueue ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-700 hover:text-white'}`}>
                <i className="fa-solid fa-list-ul text-[12px] md:text-sm"></i>
              </button>

              <button onClick={() => setShowToolbox(!showToolbox)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${showToolbox ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-700 hover:text-white'}`}>
                <i className="fa-solid fa-wand-magic-sparkles text-[12px] md:text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`h-24 md:h-36 border-t border-white/5 bg-black/60 backdrop-blur-3xl flex items-stretch shrink-0 relative overflow-hidden transition-all duration-500 ${isPureMode ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
        <div 
          className="absolute top-0 left-0 right-0 h-[1px] opacity-40"
          style={{ background: `linear-gradient(90deg, transparent, hsla(var(--beat-hue), 80%, 50%, 1), transparent)` }}
        ></div>

        <div className="flex-1 flex flex-col justify-center px-6 md:px-16 border-r border-white/5 min-w-0">
           <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.4em] mb-2 flex items-center space-x-2 transition-colors shrink-0" style={{ color: `hsla(var(--beat-hue), 80%, 50%, 1)` }}>
             <i className="fa-solid fa-heart-crack text-[10px]"></i>
             <span>网忆云 · 深夜共鸣映射</span>
           </span>
           <div key={quoteIndex} className="relative overflow-hidden animate-in fade-in slide-in-from-left-4 duration-1000">
              <p className="text-[10px] md:text-[12px] text-zinc-400 italic leading-relaxed line-clamp-2 break-words">
                “{EMOTIONAL_QUOTES[quoteIndex]?.content}”
              </p>
           </div>
        </div>
        
        <div className="hidden lg:flex flex-[0.8] flex-col justify-center px-12 min-w-0 bg-white/[0.01]">
           <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">即将触达</span>
           </div>
           <div className="flex space-x-3 overflow-hidden">
             {nextUp.slice(0, 2).map(({ song, idx }) => (
               <div key={song.id} onClick={() => onIndexChange(idx)} className="flex-shrink-0 w-44 bg-white/[0.02] border border-white/5 p-2 rounded-xl flex items-center space-x-3 cursor-pointer hover:bg-white/5 transition-all group overflow-hidden">
                 <img src={song.coverUrl} className="w-8 h-8 rounded-lg object-cover grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                 <div className="truncate flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-zinc-400 truncate">{song.name}</p>
                    <p className="text-[7px] text-zinc-700 font-black uppercase tracking-tighter truncate">{song.artist}</p>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>

      {showToolbox && (
        <div className="absolute top-1/2 right-4 sm:right-10 -translate-y-1/2 w-64 bg-[#080808] border border-white/10 rounded-3xl p-6 shadow-2xl z-[160] animate-in slide-in-from-right-10 duration-500 max-h-[80vh] overflow-y-auto custom-scrollbar">
           <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-white italic">深夜工具箱</span>
              <button onClick={() => setShowToolbox(false)} className="text-zinc-600 hover:text-white"><i className="fa-solid fa-xmark"></i></button>
           </div>
           
           <div className="space-y-6">
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">窗外雨声</span>
                    <span className="text-[8px] font-mono text-zinc-700">{Math.round(ambientRain * 100)}%</span>
                 </div>
                 <div className="h-4 relative flex items-center">
                    <input type="range" min="0" max="1" step="0.01" value={ambientRain} onChange={e => onAmbientRainChange(parseFloat(e.target.value))} className="w-full h-1.5 bg-white/5 accent-blue-600 cursor-pointer" />
                 </div>
                 
                 <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">唱片底噪</span>
                    <span className="text-[8px] font-mono text-zinc-700">{Math.round(ambientStatic * 100)}%</span>
                 </div>
                 <div className="h-4 relative flex items-center">
                    <input type="range" min="0" max="1" step="0.01" value={ambientStatic} onChange={e => onAmbientStaticChange(parseFloat(e.target.value))} className="w-full h-1.5 bg-white/5 accent-zinc-500 cursor-pointer" />
                 </div>
              </div>

              <div className="h-[1px] bg-white/5"></div>

              <div className="space-y-3">
                 <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">睡眠定时</span>
                 <div className="grid grid-cols-3 gap-2">
                    {[15, 30, 60].map(m => (
                      <button 
                        key={m} 
                        onClick={() => onSleepTimerChange(m * 60)}
                        className={`py-2 rounded-xl text-[9px] font-black transition-all ${sleepTimer === m * 60 ? 'bg-red-600 text-white' : 'bg-white/5 text-zinc-600 hover:text-white'}`}
                      >
                        {m}m
                      </button>
                    ))}
                 </div>
                 {sleepTimer !== null && (
                   <button onClick={() => onSleepTimerChange(null)} className="w-full py-2 text-[8px] font-black uppercase text-red-500/50 hover:text-red-500 transition-all">取消定时</button>
                 )}
              </div>

              <div className="h-[1px] bg-white/5"></div>

              <button 
                onClick={() => { setIsPureMode(true); setShowToolbox(false); }}
                className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center space-x-3 transition-all border border-white/5 group"
              >
                <i className="fa-solid fa-eye-slash text-zinc-600 group-hover:text-red-500"></i>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white">进入冥想模式</span>
              </button>
           </div>
        </div>
      )}

      {showFullQueue && (
        <div className="fixed inset-0 z-[200] flex">
           <div className="flex-1 bg-black/60 backdrop-blur-md animate-in fade-in duration-700" onClick={() => setShowFullQueue(false)}></div>
           <div className="w-full md:w-[420px] bg-[#030303] border-l border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-500">
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/40">
                 <div className="min-w-0">
                    <h3 className="text-2xl font-black italic text-white tracking-tighter truncate">记忆载体</h3>
                    <p className="text-[8px] text-zinc-700 font-bold uppercase tracking-[0.4em] mt-1 truncate">Memory Repository</p>
                 </div>
                 <button onClick={() => setShowFullQueue(false)} className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 transition-all shrink-0">
                    <i className="fa-solid fa-xmark"></i>
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1.5">
                {songs.map((song, idx) => (
                  <div 
                    key={song.id} 
                    onClick={() => { onIndexChange(idx); setShowFullQueue(false); }}
                    className={`flex items-center space-x-4 p-4 rounded-2xl cursor-pointer transition-all border ${idx === currentIndex ? 'bg-white/[0.04] border-white/10' : 'hover:bg-white/[0.02] border-transparent'}`}
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-950 flex-shrink-0 relative border border-white/5">
                      <img src={song.coverUrl} className={`w-full h-full object-cover transition-all duration-1000 ${idx === currentIndex ? 'opacity-40 scale-110' : 'opacity-60 grayscale'}`} />
                      {idx === currentIndex && isPlaying && (
                         <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex items-end space-x-1 h-3">
                               <div className="w-0.5 animate-[bounce_0.6s_infinite]" style={{ backgroundColor: `hsla(var(--beat-hue), 80%, 50%, 1)` }}></div>
                               <div className="w-0.5 animate-[bounce_0.8s_infinite] delay-100" style={{ backgroundColor: `hsla(var(--beat-hue), 80%, 50%, 1)` }}></div>
                               <div className="w-0.5 animate-[bounce_0.5s_infinite] delay-200" style={{ backgroundColor: `hsla(var(--beat-hue), 80%, 50%, 1)` }}></div>
                            </div>
                         </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-black truncate ${idx === currentIndex ? 'text-white' : 'text-zinc-500'}`} style={idx === currentIndex ? { color: `hsla(var(--beat-hue), 80%, 60%, 1)` } : {}}>{song.name}</p>
                      <p className="text-[8px] text-zinc-700 font-bold uppercase tracking-widest mt-1 truncate">{song.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MusicPlayer;
