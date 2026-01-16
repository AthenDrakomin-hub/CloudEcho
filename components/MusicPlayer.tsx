
import React, { useState, useEffect, memo, useMemo } from 'react';
import { Song, PlaybackMode } from '../types';
import { EMOTIONAL_QUOTES } from '../constants';

const StylusNeedle = memo(({ isPlaying }: { isPlaying: boolean }) => (
  <div 
    className="absolute top-[-20px] left-1/2 -translate-x-4 z-50 transition-transform duration-700 origin-[20%_10%] pointer-events-none"
    style={{ transform: `rotate(${isPlaying ? '0deg' : '-30deg'}) translateX(-50%)` }}
  >
    <img 
      src="https://s2.music.126.net/style/web2/img/needle.png?a50f169996720f4b301c107e38435d82" 
      className="w-24 md:w-32 drop-shadow-2xl"
      style={{ filter: 'hue-rotate(180deg) brightness(1.6) drop-shadow(0 0 12px rgba(255, 255, 255, 0.7))' }}
      alt="唱针"
    />
  </div>
));

const VinylRecord = memo(({ coverUrl, isPlaying, speed = 20 }: { coverUrl: string, isPlaying: boolean, speed?: number }) => (
  <div className="relative flex items-center justify-center">
    <div 
      className={`relative w-[70vw] h-[70vw] max-w-[320px] max-h-[320px] md:max-w-[420px] md:max-h-[420px] rounded-full border-[12px] border-black shadow-2xl flex items-center justify-center transition-all duration-1000 ${isPlaying ? 'animate-record' : 'animate-record animate-record-paused'}`}
      style={{
        background: 'radial-gradient(circle, #333 0%, #000 100%)',
        boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.5), 0 0 50px rgba(0, 210, 255, 0.3), 0 40px 100px rgba(0,0,0,1), inset 0 0 40px rgba(255,255,255,0.15)',
        animationDuration: `${speed}s`
      }}
    >
      <div className="absolute inset-0 rounded-full opacity-50" style={{ background: 'repeating-radial-gradient(circle, transparent 0, transparent 2px, #fff 3px, transparent 4px)' }}></div>
      <div className="w-[66%] h-[66%] rounded-full overflow-hidden border-[6px] border-black shadow-[inset_0_0_40px_rgba(0,0,0,1)]">
        <img src={coverUrl} className="w-full h-full object-cover" alt="封面" />
      </div>
      <div className="absolute inset-[-8px] rounded-full border-2 border-white/50 opacity-80 blur-[1px] animate-pulse"></div>
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
    const saved = localStorage.getItem('app_config');
    if (saved) setSettings(JSON.parse(saved));
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
    <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-transparent">
      <div className="bg-immersive" style={{ backgroundImage: `url(${currentSong.coverUrl})` }}></div>
      
      <header className="flex-[1.5] flex items-center justify-center px-10 pt-10 z-10">
        <div className="max-w-2xl bg-black/70 backdrop-blur-3xl border-2 border-white/50 rounded-[2rem] p-8 text-center shadow-[0_30px_80px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-top-4 duration-1000">
          <p className="text-sm md:text-lg font-serif-quote italic text-white leading-relaxed tracking-wider high-light">
            “{quote}”
          </p>
        </div>
      </header>

      <main 
        className="flex-[5] flex flex-col items-center justify-center relative z-20 cursor-pointer overflow-hidden"
        onClick={() => setIsLyricsMode(!isLyricsMode)}
      >
        <div className={`transition-all duration-1000 w-full h-full flex flex-col items-center justify-center ${isLyricsMode ? 'opacity-0 scale-90 translate-y-10 pointer-events-none absolute' : 'opacity-100 scale-100 translate-y-0'}`}>
            <div className="relative pt-10">
              <StylusNeedle isPlaying={isPlaying} />
              <VinylRecord coverUrl={currentSong.coverUrl} isPlaying={isPlaying} speed={settings.recordSpeed} />
              <div className="mt-16 text-center space-y-4">
                <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white aurora-text drop-shadow-[0_0_25px_rgba(255,255,255,0.8)]">{currentSong.name}</h2>
                <div className="flex items-center justify-center gap-6">
                   <div className="h-[3px] w-10 bg-white/80"></div>
                   <p className="text-[12px] font-black uppercase tracking-[0.7em] text-white italic high-light">{currentSong.artist}</p>
                   <div className="h-[3px] w-10 bg-white/80"></div>
                </div>
              </div>
            </div>
        </div>

        <div className={`transition-all duration-1000 w-full h-full flex flex-col items-center justify-center px-10 ${!isLyricsMode ? 'opacity-0 scale-110 -translate-y-10 pointer-events-none absolute' : 'opacity-100 scale-100 translate-y-0'}`}>
            <div className="w-full max-w-4xl flex flex-col items-center space-y-14">
                {currentSong.lyrics ? (
                    <div className="space-y-14 text-center w-full max-h-[55vh] overflow-y-auto custom-scrollbar px-10 py-8">
                        {currentSong.lyrics.split('\n').map((line: string, i: number) => {
                            const text = line.replace(/\[\d+:\d+\.\d+\]|\[\d+:\d+\]/, '').trim();
                            if (!text) return null;
                            return (
                                <p key={i} className={`text-3xl md:text-5xl font-serif-quote italic leading-relaxed transition-all duration-700 ${i === 0 ? 'text-white font-black scale-110 high-light drop-shadow-[0_0_20px_rgba(255,255,255,1)]' : 'text-white/50 hover:text-white'}`}>
                                    {text}
                                </p>
                            );
                        })}
                    </div>
                ) : (
                    <div className="space-y-12 text-center animate-pulse">
                        <p className="text-white font-black text-5xl md:text-6xl font-serif-quote italic high-light">“未探测到歌词信号”</p>
                        <div className="h-[3px] w-48 bg-gradient-to-r from-transparent via-white to-transparent mx-auto"></div>
                        <p className="text-white tracking-[0.8em] uppercase text-[12px] font-black italic">No Lyric Resonance Captured in This Frequency</p>
                    </div>
                )}
                
                <div className="mt-12 flex flex-col items-center gap-6 group">
                    <div className="w-16 h-16 rounded-full border-2 border-white/60 flex items-center justify-center group-hover:bg-white/20 group-hover:border-white transition-all shadow-[0_0_40px_rgba(0,0,0,0.8)]">
                        <i className="fa-solid fa-compact-disc text-white group-hover:animate-spin text-xl"></i>
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[0.7em] text-white italic group-hover:scale-110 transition-all">点击返回唱片视图</p>
                </div>
            </div>
        </div>
      </main>

      <footer className="flex-[3] flex flex-col items-center justify-center px-8 space-y-10 pb-16 z-30">
        <div className="w-full max-w-3xl space-y-10 bg-black/60 backdrop-blur-3xl p-12 rounded-[3.5rem] border-2 border-white/40 shadow-[0_40px_120px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-10">
            <span className="text-[11px] font-mono text-white w-16 text-right high-light">{Math.floor(currentTime/60)}:{(Math.floor(currentTime%60)).toString().padStart(2,'0')}</span>
            <div className="flex-1 h-[6px] bg-white/20 rounded-full relative group overflow-hidden border border-white/10">
              <input 
                type="range" min="0" max={duration || 0} step="0.1" value={currentTime} 
                onChange={(e) => { e.stopPropagation(); onSeek(parseFloat(e.target.value)); }} 
                className="absolute inset-0 w-full h-full opacity-0 z-40 cursor-pointer" 
              />
              <div className="absolute left-0 top-0 h-full bg-white transition-all duration-300 shadow-[0_0_25px_rgba(255,255,255,1)]" style={{ width: `${(currentTime/(duration||1))*100}%` }}></div>
            </div>
            <span className="text-[11px] font-mono text-white w-16 high-light">{duration ? `${Math.floor(duration/60)}:${(Math.floor(duration%60)).toString().padStart(2,'0')}` : '0:00'}</span>
          </div>

          <div className="flex items-center justify-between w-full">
            <div className="flex-1 flex justify-start">
              <button 
                onClick={(e) => { e.stopPropagation(); togglePlaybackMode(); }} 
                className={`transition-all p-6 rounded-2xl hover:bg-white/30 active:scale-90 border-2 ${playbackMode !== PlaybackMode.SEQUENCE ? 'text-white border-white' : 'text-white/60 border-transparent'}`}
              >
                <i className={`fa-solid ${modeIcon} text-2xl`}></i>
              </button>
            </div>

            <div className="flex items-center gap-12 md:gap-24">
              <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="text-5xl text-white hover:scale-125 transition-all active:scale-90"><i className="fa-solid fa-backward-step"></i></button>
              <button 
                onClick={(e) => { e.stopPropagation(); onTogglePlay(); }} 
                className="w-28 h-28 rounded-full bg-white text-black border-2 border-white flex items-center justify-center text-6xl hover:bg-white/90 active:scale-95 transition-all shadow-[0_0_60px_rgba(255,255,255,0.4)] relative overflow-hidden group"
              >
                <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play ml-3'} relative z-10`}></i>
              </button>
              <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="text-5xl text-white hover:scale-125 transition-all active:scale-90"><i className="fa-solid fa-forward-step"></i></button>
            </div>

            <div className="flex-1 flex justify-end items-center gap-6 relative">
              <div className="relative group">
                <button 
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  className="p-6 text-white hover:scale-110 transition-all border-2 border-transparent"
                  onClick={(e) => e.stopPropagation()}
                >
                  <i className={`fa-solid ${volume === 0 ? 'fa-volume-xmark' : volume < 0.5 ? 'fa-volume-low' : 'fa-volume-high'} text-2xl`}></i>
                </button>
                
                {showVolumeSlider && (
                  <div 
                    onMouseLeave={() => setShowVolumeSlider(false)}
                    className="absolute bottom-full mb-10 left-1/2 -translate-x-1/2 w-14 h-52 bg-[#0a0f19] border-2 border-white/40 rounded-[2.5rem] p-6 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-[0_30px_80px_rgba(0,0,0,1)] z-[100]"
                  >
                    <input 
                      type="range" min="0" max="1" step="0.01" value={volume} 
                      onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      className="w-32 h-2 appearance-none bg-white/30 rounded-full cursor-pointer -rotate-90 origin-center absolute accent-white"
                    />
                  </div>
                )}
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); setIsQueueOpen(!isQueueOpen); }} 
                className={`p-6 transition-all hover:bg-white/30 rounded-2xl border-2 ${isQueueOpen ? 'text-white border-white' : 'text-white/60 border-transparent'}`}
              >
                <i className="fa-solid fa-list-ul text-2xl"></i>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {isQueueOpen && (
        <div className="absolute inset-0 z-[500] flex justify-end" onClick={(e) => e.stopPropagation()}>
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setIsQueueOpen(false)}></div>
          <div className="relative w-full max-w-lg h-full bg-[#050a14] border-l-2 border-white/40 shadow-[0_0_150px_rgba(0,0,0,1)] flex flex-col animate-in slide-in-from-right duration-500">
            <header className="p-14 border-b-2 border-white/20 flex items-center justify-between bg-white/5">
              <div>
                <h3 className="text-3xl font-black italic aurora-text high-light">播放队列</h3>
                <p className="text-[12px] text-white uppercase font-black tracking-[0.6em] mt-4 italic">Memory Core · {songs.length} Universe Nodes</p>
              </div>
              <button onClick={() => setIsQueueOpen(false)} className="w-14 h-14 rounded-[1.5rem] bg-white text-black flex items-center justify-center hover:bg-white/90 transition-all border-2 border-white"><i className="fa-solid fa-xmark text-xl"></i></button>
            </header>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-4 pb-36">
              {songs.map((song: Song, idx: number) => (
                <div 
                  key={song.id} 
                  onClick={() => { onIndexChange(idx); setIsQueueOpen(false); }}
                  className={`flex items-center gap-8 p-8 rounded-[2.5rem] transition-all cursor-pointer group border-2 ${currentIndex === idx ? 'bg-white/20 border-white shadow-[0_20px_60px_rgba(255,255,255,0.1)]' : 'hover:bg-white/10 border-transparent'}`}
                >
                  <span className={`w-12 text-[12px] font-mono tabular-nums ${currentIndex === idx ? 'text-white high-light font-black' : 'text-white/60'}`}>
                    {currentIndex === idx ? <i className="fa-solid fa-signal animate-pulse"></i> : (idx + 1).toString().padStart(2, '0')}
                  </span>
                  <div className="flex-1 truncate">
                    <p className={`text-lg font-black truncate ${currentIndex === idx ? 'text-white high-light' : 'text-white'}`}>{song.name}</p>
                    <p className={`text-[11px] font-bold uppercase tracking-widest mt-2 italic truncate transition-colors ${currentIndex === idx ? 'text-white' : 'text-white/50'}`}>{song.artist}</p>
                  </div>
                  {currentIndex === idx && (
                      <div className="flex gap-2">
                          <div className="w-2 h-5 bg-white animate-[bounce_0.6s_infinite] shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                          <div className="w-2 h-8 bg-white animate-[bounce_0.8s_infinite] shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                          <div className="w-2 h-4 bg-white animate-[bounce_1s_infinite] shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                      </div>
                  )}
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
