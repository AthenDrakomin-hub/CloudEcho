
import React, { useState, useEffect, memo, useMemo } from 'react';
import { Song, PlaybackMode } from '../types';
import { EMOTIONAL_QUOTES } from '../constants';

const StylusNeedle = memo(({ isPlaying }: { isPlaying: boolean }) => (
  <div 
    className="absolute top-[-20px] left-1/2 -translate-x-4 z-50 transition-transform duration-700 origin-[20%_10%]"
    style={{ transform: `rotate(${isPlaying ? '0deg' : '-30deg'}) translateX(-50%)` }}
  >
    <img 
      src="https://s2.music.126.net/style/web2/img/needle.png?a50f169996720f4b301c107e38435d82" 
      className="w-24 md:w-32 drop-shadow-2xl"
      alt="needle"
    />
  </div>
));

const VinylRecord = memo(({ coverUrl, isPlaying, speed = 20 }: { coverUrl: string, isPlaying: boolean, speed?: number }) => (
  <div className="relative flex items-center justify-center">
    <div 
      className={`relative w-[70vw] h-[70vw] max-w-[320px] max-h-[320px] md:max-w-[420px] md:max-h-[420px] rounded-full border-[10px] border-black/90 shadow-2xl flex items-center justify-center transition-all duration-1000 ${isPlaying ? 'animate-record' : 'animate-record animate-record-paused'}`}
      style={{
        background: 'radial-gradient(circle, #222 0%, #000 100%)',
        boxShadow: '0 0 0 10px rgba(255,255,255,0.05), 0 20px 50px rgba(0,0,0,0.8)',
        animationDuration: `${speed}s`
      }}
    >
      <div className="absolute inset-0 rounded-full opacity-30" style={{ background: 'repeating-radial-gradient(circle, transparent 0, transparent 2px, #fff 3px, transparent 4px)' }}></div>
      <div className="w-[65%] h-[65%] rounded-full overflow-hidden border-4 border-black shadow-inner">
        <img src={coverUrl} className="w-full h-full object-cover" alt="cover" />
      </div>
    </div>
  </div>
));

const MusicPlayer: React.FC<any> = ({ 
  songs, currentIndex, onIndexChange, isPlaying, onTogglePlay, onNext, onPrev, currentTime, duration, onSeek, playbackMode, onModeChange, volume, onVolumeChange
}) => {
  const [isLyricsMode, setIsLyricsMode] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [settings, setSettings] = useState({ recordSpeed: 20 });

  useEffect(() => {
    // 监听本地配置变化，如果是真实持久化应使用全局 Context 或 Store
    const interval = setInterval(() => {
       const saved = localStorage.getItem('app_config');
       if (saved) setSettings(JSON.parse(saved));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const currentSong = songs[currentIndex];

  const quote = useMemo(() => {
    if (!currentSong) return '';
    const hash = currentSong.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return EMOTIONAL_QUOTES[hash % EMOTIONAL_QUOTES.length].content;
  }, [currentSong]);

  const togglePlaybackMode = () => {
    const modes = [PlaybackMode.SEQUENCE, PlaybackMode.REPEAT_ONE, PlaybackMode.SHUFFLE];
    const nextIdx = (modes.indexOf(playbackMode) + 1) % modes.length;
    onModeChange(modes[nextIdx]);
  };

  const modeIcon = useMemo(() => {
    switch(playbackMode) {
      case PlaybackMode.SHUFFLE: return 'fa-shuffle';
      case PlaybackMode.REPEAT_ONE: return 'fa-repeat';
      default: return 'fa-arrow-rotate-right';
    }
  }, [playbackMode]);

  if (!currentSong) return null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      <div className="bg-immersive" style={{ backgroundImage: `url(${currentSong.coverUrl})` }}></div>
      
      <header className="flex-[1.5] flex items-center justify-center px-10 pt-10 z-10">
        <div className="max-w-2xl bg-black/20 backdrop-blur-xl border border-white/5 rounded-2xl p-6 text-center shadow-2xl animate-in fade-in slide-in-from-top-4 duration-1000">
          <p className="text-sm md:text-base font-serif-quote italic text-white/90 leading-relaxed tracking-wide">
            “{quote}”
          </p>
        </div>
      </header>

      <main 
        className="flex-[5] flex flex-col items-center justify-center relative z-20 cursor-pointer"
        onClick={() => setIsLyricsMode(!isLyricsMode)}
      >
        {!isLyricsMode ? (
          <div className="relative pt-10">
            <StylusNeedle isPlaying={isPlaying} />
            <VinylRecord coverUrl={currentSong.coverUrl} isPlaying={isPlaying} speed={settings.recordSpeed} />
            <div className="mt-12 text-center space-y-2">
              <h2 className="text-2xl md:text-4xl font-black italic tracking-tighter text-white drop-shadow-lg">{currentSong.name}</h2>
              <p className="text-xs font-black uppercase tracking-[0.4em] text-white/40">{currentSong.artist}</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full max-w-2xl flex flex-col items-center justify-center px-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="space-y-6 text-center text-white/80 font-serif-quote italic text-lg md:text-2xl leading-loose overflow-y-auto no-scrollbar max-h-[50vh]">
              <p className="text-white font-black scale-110">这首歌暂无歌词映射</p>
              <p className="opacity-40 tracking-widest uppercase text-xs font-black mt-4 italic">No Lyric Signal Found</p>
            </div>
            <p className="mt-10 text-[10px] font-black uppercase tracking-widest text-white/20 italic">点击切换唱片视图</p>
          </div>
        )}
      </main>

      <footer className="flex-[3] flex flex-col items-center justify-center px-8 space-y-8 pb-10 z-30">
        <div className="w-full max-w-xl space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-white/30 w-10">{Math.floor(currentTime/60)}:{(Math.floor(currentTime%60)).toString().padStart(2,'0')}</span>
            <div className="flex-1 h-[2px] bg-white/10 rounded-full relative group">
              <input 
                type="range" min="0" max={duration || 0} step="0.1" value={currentTime} 
                onChange={(e) => onSeek(parseFloat(e.target.value))} 
                className="absolute inset-0 w-full h-full opacity-0 z-40 cursor-pointer" 
              />
              <div className="absolute left-0 top-0 h-full bg-[#C20C0C] rounded-full group-hover:shadow-[0_0_15px_#C20C0C]" style={{ width: `${(currentTime/(duration||1))*100}%` }}></div>
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `${(currentTime/(duration||1))*100}%` }}></div>
            </div>
            <span className="text-[10px] font-mono text-white/30 w-10">{duration ? `${Math.floor(duration/60)}:${(Math.floor(duration%60)).toString().padStart(2,'0')}` : '0:00'}</span>
          </div>

          <div className="flex items-center justify-between w-full">
            {/* 播放模式 */}
            <div className="flex-1 flex justify-start">
              <button 
                onClick={togglePlaybackMode} 
                className={`transition-all p-3 rounded-full hover:bg-white/5 active:scale-90 ${playbackMode !== PlaybackMode.SEQUENCE ? 'text-[#C20C0C]' : 'text-white/40'}`}
              >
                <i className={`fa-solid ${modeIcon} text-lg`}></i>
              </button>
            </div>

            {/* 主控制器 */}
            <div className="flex items-center gap-8 md:gap-14">
              <button onClick={onPrev} className="text-2xl text-white/60 hover:text-white transition-all active:scale-90"><i className="fa-solid fa-backward-step"></i></button>
              <button 
                onClick={onTogglePlay} 
                className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-white/10 flex items-center justify-center text-3xl text-white hover:bg-white/5 active:scale-90 transition-all shadow-2xl"
              >
                <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play ml-1'}`}></i>
              </button>
              <button onClick={onNext} className="text-2xl text-white/60 hover:text-white transition-all active:scale-90"><i className="fa-solid fa-forward-step"></i></button>
            </div>

            {/* 列表与音量 */}
            <div className="flex-1 flex justify-end items-center gap-4 relative">
              <div className="relative group">
                <button 
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  className="p-3 text-white/40 hover:text-white transition-all"
                >
                  <i className={`fa-solid ${volume === 0 ? 'fa-volume-xmark' : volume < 0.5 ? 'fa-volume-low' : 'fa-volume-high'}`}></i>
                </button>
                
                {showVolumeSlider && (
                  <div 
                    onMouseLeave={() => setShowVolumeSlider(false)}
                    className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-8 h-32 bg-[#181818] border border-white/10 rounded-full p-4 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-2 duration-200 shadow-2xl z-[100]"
                  >
                    <input 
                      type="range" min="0" max="1" step="0.01" value={volume} 
                      onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                      className="w-24 h-1 appearance-none bg-white/10 rounded-full cursor-pointer -rotate-90 origin-center absolute"
                      style={{
                        accentColor: '#C20C0C'
                      }}
                    />
                  </div>
                )}
              </div>

              <button 
                onClick={() => setIsQueueOpen(!isQueueOpen)} 
                className={`p-3 transition-all hover:bg-white/5 rounded-full ${isQueueOpen ? 'text-[#C20C0C]' : 'text-white/40'}`}
              >
                <i className="fa-solid fa-list-ul text-lg"></i>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* 侧边播放列表面板 */}
      {isQueueOpen && (
        <div className="absolute inset-0 z-[500] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsQueueOpen(false)}></div>
          <div className="relative w-full max-w-md h-full bg-[#121212] border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <header className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black italic">当前播放队列</h3>
                <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">{songs.length} 信号流记录</p>
              </div>
              <button onClick={() => setIsQueueOpen(false)} className="text-white/20 hover:text-white"><i className="fa-solid fa-xmark"></i></button>
            </header>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1">
              {songs.map((song: Song, idx: number) => (
                <div 
                  key={song.id} 
                  onClick={() => { onIndexChange(idx); setIsQueueOpen(false); }}
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all cursor-pointer group ${currentIndex === idx ? 'bg-[#C20C0C]/10 border border-[#C20C0C]/20' : 'hover:bg-white/5'}`}
                >
                  <span className={`w-6 text-[10px] font-mono tabular-nums ${currentIndex === idx ? 'text-[#C20C0C]' : 'text-white/20'}`}>
                    {currentIndex === idx ? <i className="fa-solid fa-volume-high animate-pulse"></i> : idx + 1}
                  </span>
                  <div className="flex-1 truncate">
                    <p className={`text-sm font-black truncate ${currentIndex === idx ? 'text-[#C20C0C]' : 'text-white/90'}`}>{song.name}</p>
                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest truncate">{song.artist}</p>
                  </div>
                  {currentIndex === idx && (
                    <div className="flex gap-0.5 items-end h-3">
                      <div className="w-0.5 bg-[#C20C0C] animate-[music-bar_0.5s_infinite_alternate]"></div>
                      <div className="w-0.5 bg-[#C20C0C] animate-[music-bar_0.8s_infinite_alternate]"></div>
                      <div className="w-0.5 bg-[#C20C0C] animate-[music-bar_0.6s_infinite_alternate]"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes music-bar {
          from { height: 20%; }
          to { height: 100%; }
        }
      `}</style>
    </div>
  );
};

export default MusicPlayer;
