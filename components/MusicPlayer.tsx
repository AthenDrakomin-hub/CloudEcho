
import React, { useState, useRef, useEffect } from 'react';
import { Song, PlaybackMode } from '../types';
import { EMOTIONAL_QUOTES } from '../constants';

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
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ 
  songs, currentIndex, onIndexChange, shared = false,
  isPlaying, onTogglePlay, currentTime, duration, onSeek, audioRef,
  playbackMode, onModeChange
}) => {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [quoteVisible, setQuoteVisible] = useState(true);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const currentSong = songs[currentIndex];

  useEffect(() => {
    // 换歌时刷新随机文案，并添加淡入淡出动画效果
    setQuoteVisible(false);
    setTimeout(() => {
      setQuoteIndex(Math.floor(Math.random() * EMOTIONAL_QUOTES.length));
      setQuoteVisible(true);
    }, 500);
  }, [currentIndex]);

  const togglePlaybackMode = () => {
    const modes = [PlaybackMode.SEQUENCE, PlaybackMode.SHUFFLE, PlaybackMode.REPEAT_ONE];
    const currentIndex = modes.indexOf(playbackMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    onModeChange(nextMode);
  };

  const getModeIcon = () => {
    switch (playbackMode) {
      case PlaybackMode.SHUFFLE: return 'fa-shuffle';
      case PlaybackMode.REPEAT_ONE: return 'fa-repeat text-red-500';
      default: return 'fa-repeat';
    }
  };

  const handleNext = () => {
    if (songs.length === 0) return;
    let nextIndex;
    if (playbackMode === PlaybackMode.SHUFFLE) {
      nextIndex = Math.floor(Math.random() * songs.length);
      if (songs.length > 1 && nextIndex === currentIndex) nextIndex = (nextIndex + 1) % songs.length;
    } else {
      nextIndex = (currentIndex + 1) % songs.length;
    }
    onIndexChange(nextIndex);
  };

  const handlePrev = () => {
    onIndexChange((currentIndex - 1 + songs.length) % songs.length);
  };

  useEffect(() => {
    if (!canvasRef.current || !audioRef.current) return;
    
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      if (!analyserRef.current && audioRef.current) {
        try {
          const analyser = audioContextRef.current.createAnalyser();
          const source = audioContextRef.current.createMediaElementSource(audioRef.current);
          source.connect(analyser);
          analyser.connect(audioContextRef.current.destination);
          analyserRef.current = analyser;
        } catch (e) { console.warn("Analyzer already connected"); }
      }
    };

    if (isPlaying) initAudio();

    const analyser = analyserRef.current;
    if (!analyser) return;

    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const ctx = canvasRef.current.getContext('2d')!;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      
      const centerX = canvasRef.current!.width / 2;
      const centerY = canvasRef.current!.height / 2;
      const radius = window.innerWidth < 768 ? 100 : 160;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * (window.innerWidth < 768 ? 40 : 80);
        const angle = (i * 2 * Math.PI) / bufferLength;
        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius + barHeight);

        ctx.strokeStyle = `rgba(194, 12, 12, ${0.2 + (dataArray[i] / 255) * 0.8})`;
        ctx.lineWidth = window.innerWidth < 768 ? 2 : 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    };
    draw();
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [isPlaying, currentSong]);

  if (!currentSong) return null;

  return (
    <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden bg-[#020202]">
      {/* 沉浸式动态背景 */}
      <div className="absolute inset-0 -z-10 opacity-30 blur-[120px] scale-110 transition-all duration-[2000ms]" style={{ backgroundImage: `url(${currentSong.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
      <div className="absolute inset-0 bg-black/70 -z-20"></div>

      <div className="flex-[1.6] flex flex-col items-center justify-center p-4 md:p-12 relative overflow-hidden">
        {/* 黑胶视觉容器 */}
        <div className="relative group cursor-pointer" onClick={onTogglePlay}>
          <canvas ref={canvasRef} width={600} height={600} className="absolute inset-0 -translate-x-[75px] -translate-y-[75px] md:-translate-x-[90px] md:-translate-y-[90px] z-0 opacity-60 pointer-events-none" />
          <div className="w-60 h-60 md:w-[26rem] md:h-[26rem] relative rounded-full border-[10px] md:border-[14px] border-[#080808] shadow-[0_30px_90px_rgba(0,0,0,1)] vinyl-border flex items-center justify-center z-10 overflow-hidden ring-1 ring-white/5">
            <div className={`w-full h-full p-12 md:p-18 ${isPlaying ? 'animate-spin-slow' : 'animate-spin-slow animate-spin-paused'}`}>
              <div className="w-full h-full rounded-full bg-cover bg-center border-[6px] border-black/80 shadow-2xl" style={{ backgroundImage: `url(${currentSong.coverUrl})` }}>
                 <div className="absolute inset-0 bg-[radial-gradient(circle,_transparent_30%,_rgba(0,0,0,0.6)_100%)] rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* 播放控制 */}
        <div className="w-full max-w-lg mt-10 md:mt-16 text-center z-10 space-y-8 px-6">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h2 className="text-2xl md:text-5xl font-black text-white tracking-tighter truncate drop-shadow-2xl italic">{currentSong.name}</h2>
            <p className="text-red-600 font-black uppercase tracking-[0.4em] text-[10px] md:text-xs mt-3 flex items-center justify-center space-x-2">
              <span className="w-4 h-px bg-red-600/30"></span>
              <span>{currentSong.artist}</span>
              <span className="w-4 h-px bg-red-600/30"></span>
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-5">
              <span className="text-[10px] text-zinc-600 font-mono w-12 text-right">{Math.floor(currentTime/60)}:{Math.floor(currentTime%60).toString().padStart(2,'0')}</span>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full relative group">
                <input type="range" min="0" max={duration || 0} step="0.1" value={currentTime} onChange={(e)=> onSeek(parseFloat(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer" />
                <div className="absolute left-0 top-0 h-full bg-red-600 shadow-[0_0_15px_rgba(194,12,12,0.6)] rounded-full transition-all duration-100" style={{ width: `${(currentTime / duration) * 100 || 0}%` }}></div>
                <div className="absolute h-3 w-3 bg-white rounded-full -top-0.5 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `calc(${(currentTime / duration) * 100 || 0}% - 6px)` }}></div>
              </div>
              <span className="text-[10px] text-zinc-600 font-mono w-12">{Math.floor(duration/60)}:{Math.floor(duration%60).toString().padStart(2,'0')}</span>
            </div>

            <div className="flex items-center justify-center space-x-6 md:space-x-12">
              <button onClick={togglePlaybackMode} className="text-zinc-600 hover:text-white text-lg w-8 h-8 flex items-center justify-center transition-all relative">
                <i className={`fa-solid ${getModeIcon()}`}></i>
                {playbackMode === PlaybackMode.REPEAT_ONE && <span className="absolute text-[8px] font-black top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] text-white pointer-events-none">1</span>}
              </button>
              
              <button onClick={handlePrev} className="text-zinc-500 hover:text-white text-3xl active:scale-75 transition-all"><i className="fa-solid fa-backward-step"></i></button>
              
              <button onClick={onTogglePlay} className="w-16 h-16 md:w-22 md:h-22 bg-white rounded-full flex items-center justify-center text-black shadow-[0_0_50px_rgba(255,255,255,0.1)] active:scale-90 hover:scale-105 transition-all">
                <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play ml-1.5'} text-3xl md:text-4xl`}></i>
              </button>
              
              <button onClick={handleNext} className="text-zinc-500 hover:text-white text-3xl active:scale-75 transition-all"><i className="fa-solid fa-forward-step"></i></button>
              
              <button className="text-zinc-600 hover:text-white text-lg w-8 h-8 flex items-center justify-center transition-all opacity-40">
                <i className="fa-solid fa-bars-staggered"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 侧边文案墙 */}
      <div className="flex-1 bg-black/60 backdrop-blur-3xl border-l border-white/5 flex flex-col h-[38vh] md:h-auto animate-in slide-in-from-right duration-700">
        <div className="p-8 md:p-10 pb-4 flex-1 overflow-hidden flex flex-col">
           <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">子夜队列 ({songs.length})</span>
              <div className="flex items-center space-x-2">
                 <div className="w-1 h-1 rounded-full bg-red-600"></div>
                 <span className="text-[8px] text-zinc-700 font-bold uppercase">Streaming Live</span>
              </div>
           </div>
           <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
             {songs.map((song, idx) => (
               <div key={song.id} onClick={() => onIndexChange(idx)} className={`flex items-center space-x-4 p-4 rounded-2xl transition-all cursor-pointer group ${idx === currentIndex ? 'bg-red-600/10 border border-red-600/20' : 'hover:bg-white/5 border border-transparent'}`}>
                 <div className="w-10 h-10 rounded-xl overflow-hidden relative flex-shrink-0">
                    <img src={song.coverUrl} className={`w-full h-full object-cover ${idx === currentIndex && isPlaying ? 'animate-pulse' : ''}`} />
                    {idx === currentIndex && isPlaying && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="flex items-end space-x-0.5 h-3">
                          <div className="w-0.5 bg-red-600 animate-[bounce_0.6s_infinite]"></div>
                          <div className="w-0.5 bg-red-600 animate-[bounce_0.8s_infinite]"></div>
                          <div className="w-0.5 bg-red-600 animate-[bounce_0.5s_infinite]"></div>
                        </div>
                      </div>
                    )}
                 </div>
                 <div className="truncate flex-1">
                    <p className={`text-xs font-black truncate transition-colors ${idx === currentIndex ? 'text-red-500' : 'text-zinc-400 group-hover:text-white'}`}>{song.name}</p>
                    <p className="text-[9px] opacity-40 truncate uppercase font-bold tracking-tight mt-1">{song.artist}</p>
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* 动态伤感文案区 */}
        <div className="p-8 md:p-12 border-t border-white/5 bg-black/40 relative group overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
            <i className="fa-solid fa-quote-right text-8xl text-red-600"></i>
          </div>
          <div className="flex items-center justify-between mb-6">
             <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em] italic">灵魂共鸣</span>
             <div className="flex space-x-1">
               <div className="w-1.5 h-1.5 rounded-full bg-red-600/20"></div>
               <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></div>
             </div>
          </div>
          <div className="min-h-[140px] flex items-center relative">
             <p className={`text-sm md:text-lg text-zinc-300 italic leading-relaxed font-light tracking-wide transition-all duration-1000 ${quoteVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
               “{EMOTIONAL_QUOTES[quoteIndex]?.content}”
             </p>
          </div>
          <div className="mt-6 flex items-center space-x-4 opacity-30">
             <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Nocturne Echo · {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
