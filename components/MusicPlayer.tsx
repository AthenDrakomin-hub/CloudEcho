
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
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const currentSong = songs[currentIndex];

  useEffect(() => {
    // 换歌时刷新随机文案
    setQuoteIndex(Math.floor(Math.random() * EMOTIONAL_QUOTES.length));
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
      case PlaybackMode.REPEAT_ONE: return 'fa-repeat text-red-500'; // 借用 repeat 带个标记
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
        } catch (e) {
          console.warn("频谱节点已连接或受到限制:", e);
        }
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
      const radius = window.innerWidth < 768 ? 110 : 180;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * (window.innerWidth < 768 ? 40 : 80);
        const angle = (i * 2 * Math.PI) / bufferLength;
        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius + barHeight);

        ctx.strokeStyle = `rgba(194, 12, 12, ${0.15 + (dataArray[i] / 255) * 0.85})`;
        ctx.lineWidth = window.innerWidth < 768 ? 2 : 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    };
    draw();
    return () => animationRef.current ? cancelAnimationFrame(animationRef.current) : undefined;
  }, [isPlaying, currentSong]);

  if (!currentSong) return null;

  return (
    <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden bg-[#020202]">
      {/* 沉浸式背景 */}
      <div className="absolute inset-0 -z-10 opacity-40 blur-[100px] scale-125 transition-all duration-1000" style={{ backgroundImage: `url(${currentSong.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
      <div className="absolute inset-0 bg-black/60 -z-20"></div>

      {/* 核心播放区域 */}
      <div className="flex-[1.6] flex flex-col items-center justify-center p-4 md:p-12 relative overflow-hidden">
        {/* 黑胶视觉 */}
        <div className="relative group cursor-pointer" onClick={onTogglePlay}>
          <canvas ref={canvasRef} width={600} height={600} className="absolute inset-0 -translate-x-[70px] -translate-y-[70px] md:-translate-x-[90px] md:-translate-y-[90px] z-0 opacity-60" />
          <div className="w-60 h-60 md:w-[28rem] md:h-[28rem] relative rounded-full border-[12px] md:border-[16px] border-[#111] shadow-[0_20px_60px_rgba(0,0,0,0.9)] vinyl-border flex items-center justify-center z-10 overflow-hidden">
            <div className={`w-full h-full p-14 md:p-20 ${isPlaying ? 'animate-spin-slow' : 'animate-spin-slow animate-spin-paused'}`}>
              <div className="w-full h-full rounded-full bg-cover bg-center border-4 border-black/50 shadow-inner" style={{ backgroundImage: `url(${currentSong.coverUrl})` }}>
                 <div className="absolute inset-0 bg-[radial-gradient(circle,_transparent_40%,_rgba(0,0,0,0.5)_100%)] rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* 歌曲信息与交互控制 */}
        <div className="w-full max-w-lg mt-8 md:mt-14 text-center z-10 space-y-6 md:space-y-8 px-6">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tighter truncate drop-shadow-xl">{currentSong.name}</h2>
            <p className="text-red-600 font-black uppercase tracking-[0.3em] text-[10px] md:text-xs mt-2">{currentSong.artist}</p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <span className="text-[10px] text-zinc-500 font-mono w-10 text-right">{Math.floor(currentTime/60)}:{Math.floor(currentTime%60).toString().padStart(2,'0')}</span>
              <div className="flex-1 h-2.5 md:h-1.5 bg-white/10 rounded-full relative group">
                <input type="range" min="0" max={duration || 0} step="0.1" value={currentTime} onChange={(e)=> onSeek(parseFloat(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer" />
                <div className="absolute left-0 top-0 h-full bg-red-600 shadow-[0_0_12px_#C20C0C]" style={{ width: `${(currentTime / duration) * 100 || 0}%` }}></div>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono w-10">{Math.floor(duration/60)}:{Math.floor(duration%60).toString().padStart(2,'0')}</span>
            </div>

            <div className="flex items-center justify-center space-x-6 md:space-x-12 relative">
              <button onClick={togglePlaybackMode} className="text-zinc-500 hover:text-white text-lg w-8 h-8 flex items-center justify-center transition-all relative">
                <i className={`fa-solid ${getModeIcon()}`}></i>
                {playbackMode === PlaybackMode.REPEAT_ONE && <span className="absolute text-[8px] font-black top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] text-white pointer-events-none">1</span>}
              </button>
              
              <button onClick={handlePrev} className="text-zinc-500 hover:text-white text-2xl active:scale-75 transition-all"><i className="fa-solid fa-backward-step"></i></button>
              
              <button onClick={onTogglePlay} className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center text-black shadow-2xl active:scale-90 transition-all">
                <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play ml-1'} text-2xl md:text-3xl`}></i>
              </button>
              
              <button onClick={handleNext} className="text-zinc-500 hover:text-white text-2xl active:scale-75 transition-all"><i className="fa-solid fa-forward-step"></i></button>
              
              <button className="text-zinc-500 hover:text-white text-lg w-8 h-8 flex items-center justify-center transition-all opacity-40">
                <i className="fa-solid fa-list-ul"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 侧边文案与队列区 (手机端底部显示) */}
      <div className={`flex-1 bg-black/50 md:bg-black/70 backdrop-blur-3xl border-l border-white/5 flex flex-col h-[35vh] md:h-auto`}>
        <div className="p-6 md:p-10 pb-4 flex-1 overflow-hidden flex flex-col">
           <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">播放队列 ({songs.length})</span>
           </div>
           <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
             {songs.map((song, idx) => (
               <div key={song.id} onClick={() => onIndexChange(idx)} className={`flex items-center space-x-3 p-3 rounded-xl transition-all cursor-pointer ${idx === currentIndex ? 'bg-red-600/10 text-red-600 shadow-inner' : 'text-zinc-500 hover:bg-white/5'}`}>
                 <img src={song.coverUrl} className="w-8 h-8 rounded-lg object-cover" />
                 <div className="truncate">
                    <p className="text-xs font-bold truncate">{song.name}</p>
                    <p className="text-[9px] opacity-60 truncate uppercase font-bold">{song.artist}</p>
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* 经典文案墙 */}
        <div className="p-6 md:p-10 border-t border-white/5 bg-black/20">
          <div className="flex items-center justify-between mb-4">
             <span className="text-[10px] font-black text-red-600 uppercase tracking-widest italic">情感共鸣</span>
             <i className="fa-solid fa-quote-right text-red-600/20 text-xl"></i>
          </div>
          <div className="min-h-[100px] flex items-center">
             <p className="text-sm md:text-base text-zinc-300 italic leading-relaxed font-light tracking-wide animate-in fade-in duration-1000">
               "{EMOTIONAL_QUOTES[quoteIndex]?.content}"
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
