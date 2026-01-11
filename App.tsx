
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Song, Video, ViewMode, PlaybackMode, AppNotification, NotificationType } from './types';
import { fetchSongs, fetchVideos, getCachedMediaUrl } from './services/s3Service';
import { setToken } from './services/discoveryService';
import MusicPlayer from './components/MusicPlayer';
import MusicManager from './components/MusicManager';
import VideoSection from './components/VideoSection';
import ApiDocs from './components/ApiDocs';
import SongDetails from './components/SongDetails';
import VideoDetails from './components/VideoDetails';
import Settings from './components/Settings';
import CacheSpace from './components/CacheSpace';
import Discovery from './components/Discovery';
import ErrorNotification from './components/ErrorNotification';

const Logo: React.FC<{ isPlaying?: boolean }> = ({ isPlaying }) => (
  <div className={`relative w-16 h-16 flex items-center justify-center transition-all duration-1000 ${isPlaying ? 'scale-110' : 'scale-100'}`}>
    {/* 极光发光底座 */}
    <div className={`absolute inset-0 bg-gradient-to-br from-indigo-600/40 via-purple-600/40 to-pink-600/40 blur-xl rounded-full transition-opacity duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-40'}`}></div>
    
    <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]">
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      {/* 音乐波动环 */}
      <circle cx="70" cy="50" r="22" fill="none" stroke="url(#logo-grad)" strokeWidth="6" className={isPlaying ? 'animate-[pulse_2s_infinite]' : ''} />
      <path d="M70 35 L70 65 M78 40 L78 60 M62 40 L62 60" stroke="url(#logo-grad)" strokeWidth="2" strokeLinecap="round" className={isPlaying ? 'animate-[dj-bar_0.6s_infinite]' : ''} />
      
      {/* 核心高音谱号 */}
      <path 
        d="M45 85 C40 85 35 80 35 75 C35 68 45 62 45 50 C45 35 30 25 35 15 C38 10 48 10 50 20 L50 80 C50 88 45 92 40 92 C35 92 30 88 30 82" 
        fill="none" 
        stroke="white" 
        strokeWidth="5" 
        strokeLinecap="round"
        className="drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]"
      />
    </svg>
  </div>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.PLAYER);
  const [songs, setSongs] = useState<Song[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharedMode, setIsSharedMode] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>(PlaybackMode.SEQUENCE);
  const [activeAudioUrl, setActiveAudioUrl] = useState<string>('');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isUIHidden, setIsUIHidden] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(() => localStorage.getItem('theme_high_contrast') === 'true');
  const [brightness, setBrightness] = useState(() => parseFloat(localStorage.getItem('theme_brightness') || '1'));

  const [hotkeySettings, setHotkeySettings] = useState(() => {
    const saved = localStorage.getItem('hotkey_settings');
    return saved ? JSON.parse(saved) : { master: true, media: true, nav: true, visual: true };
  });

  const audioRef = useRef<HTMLAudioElement>(null);

  const pushNotification = useCallback((message: string, type: NotificationType = 'error') => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    localStorage.setItem('hotkey_settings', JSON.stringify(hotkeySettings));
  }, [hotkeySettings]);

  useEffect(() => {
    if (isHighContrast) document.body.classList.add('high-contrast');
    else document.body.classList.remove('high-contrast');
    localStorage.setItem('theme_high_contrast', String(isHighContrast));
  }, [isHighContrast]);

  useEffect(() => {
    document.documentElement.style.setProperty('--text-brightness', brightness.toString());
    localStorage.setItem('theme_brightness', brightness.toString());
  }, [brightness]);

  const handleTogglePlay = useCallback(async () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        pushNotification("播放失败，请检查网络连接", "error");
      }
    }
  }, [isPlaying, pushNotification]);

  const nextSong = useCallback(() => {
    if (songs.length === 0) return;
    setCurrentIndex(prev => (playbackMode === PlaybackMode.SHUFFLE ? Math.floor(Math.random() * songs.length) : (prev + 1) % songs.length));
  }, [songs.length, playbackMode]);

  const prevSong = useCallback(() => {
    if (songs.length === 0) return;
    setCurrentIndex(prev => (prev - 1 + songs.length) % songs.length);
  }, [songs.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hotkeySettings.master || ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (hotkeySettings.media) {
        if (e.code === 'Space') { e.preventDefault(); handleTogglePlay(); }
        if (isCmdOrCtrl && e.code === 'ArrowRight') { e.preventDefault(); nextSong(); }
        if (isCmdOrCtrl && e.code === 'ArrowLeft') { e.preventDefault(); prevSong(); }
        if (e.code === 'ArrowUp') { e.preventDefault(); if (audioRef.current) audioRef.current.volume = Math.min(1, audioRef.current.volume + 0.05); }
        if (e.code === 'ArrowDown') { e.preventDefault(); if (audioRef.current) audioRef.current.volume = Math.max(0, audioRef.current.volume - 0.05); }
      }
      if (hotkeySettings.nav) {
        if (isCmdOrCtrl && e.code === 'KeyK') { e.preventDefault(); setCurrentView(ViewMode.DISCOVERY); }
        if (e.code === 'KeyM') {
          e.preventDefault();
          const modes = [PlaybackMode.SEQUENCE, PlaybackMode.SHUFFLE, PlaybackMode.REPEAT_ONE];
          setPlaybackMode(modes[(modes.indexOf(playbackMode) + 1) % modes.length]);
        }
      }
      if (hotkeySettings.visual && e.code === 'KeyH') { e.preventDefault(); setIsUIHidden(prev => !prev); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, nextSong, prevSong, playbackMode, isUIHidden, hotkeySettings]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'shared') setIsSharedMode(true);
    loadResources();
  }, []);

  useEffect(() => {
    if (songs[currentIndex]) {
      const song = songs[currentIndex];
      if (song.isExternal) setActiveAudioUrl(song.url);
      else getCachedMediaUrl(song.id, song.url).then(setActiveAudioUrl).catch(() => setActiveAudioUrl(song.url));
    }
  }, [currentIndex, songs]);

  const loadResources = async () => {
    setIsLoading(true);
    try {
      const [fs, fv] = await Promise.all([fetchSongs(), fetchVideos()]);
      setSongs(fs); setVideos(fv);
    } catch (e) { pushNotification("云端链路异常", "error"); }
    setIsLoading(false);
  };

  const menuItems = [
    { id: ViewMode.PLAYER, icon: 'fa-play', label: '正在播放' },
    { id: ViewMode.DISCOVERY, icon: 'fa-earth-asia', label: '发现音乐' },
    { id: ViewMode.VIDEO, icon: 'fa-clapperboard', label: '视频空间' },
    ...(isSharedMode ? [] : [
      { id: ViewMode.MANAGER, icon: 'fa-shapes', label: '我的音乐库' },
      { id: ViewMode.CACHE_SPACE, icon: 'fa-database', label: '缓存管理' }
    ]),
    { id: ViewMode.API_DOCS, icon: 'fa-paper-plane', label: '分享链接' },
    { id: ViewMode.SETTINGS, icon: 'fa-sliders', label: '设置' }
  ];

  return (
    <div className={`flex flex-col md:flex-row h-screen w-screen overflow-hidden p-3 md:p-6 gap-3 md:gap-8 bg-transparent text-white transition-all duration-1000 ${isUIHidden ? 'opacity-20' : 'opacity-100'}`}>
      <ErrorNotification notifications={notifications} onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />
      
      <nav className={`hidden md:flex w-72 h-full glass-dark-morphism rounded-[3.5rem] flex-col py-12 px-6 z-[100] transition-all duration-700 ${isUIHidden ? '-translate-x-[110%]' : 'translate-x-0'}`}>
        <div className="mb-16 px-2 flex items-center space-x-5">
          <Logo isPlaying={isPlaying} />
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tighter italic leading-none text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]">网忆云</h1>
            <div className="flex items-center space-x-2 mt-1.5">
               <span className="w-4 h-[1px] bg-indigo-500"></span>
               <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] italic">子夜回响</p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
          {menuItems.map(item => (
            <button 
              key={item.id} onClick={() => setCurrentView(item.id)} 
              className={`w-full flex items-center space-x-5 p-5 rounded-3xl transition-all duration-500 font-black text-[11px] ${currentView === item.id ? 'bg-white text-black shadow-2xl scale-105' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
            >
              <i className={`fa-solid ${item.icon} text-lg`}></i>
              <span className="tracking-widest uppercase">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto pt-10 px-2 text-center">
           <div className="bg-white/5 rounded-[2.5rem] p-6 border border-white/5 group hover:border-indigo-500/30 transition-all">
              <p className="text-[7px] font-black text-cyan-400 uppercase tracking-[0.5em] mb-3">System Online</p>
              <span className="text-[10px] font-black text-white/60 tracking-widest italic group-hover:text-white transition-colors">极光链路同步中</span>
           </div>
        </div>
      </nav>

      <main className={`flex-1 glass-dark-morphism rounded-[3rem] md:rounded-[4.5rem] relative overflow-hidden flex flex-col transition-all duration-1000 mb-20 md:mb-0 border border-white/5 shadow-2xl ${isUIHidden ? 'scale-95 blur-sm brightness-50' : 'scale-100'}`}>
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8">
            <div className="w-16 h-16 border-2 border-white/10 border-t-indigo-500 rounded-full animate-spin shadow-[0_0_40px_rgba(99,102,241,0.2)]"></div>
            <p className="font-black text-[9px] uppercase tracking-[0.8em] text-white/20 animate-pulse">映射极光节点中...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden h-full">
            {currentView === ViewMode.PLAYER && (
              <MusicPlayer 
                songs={songs} currentIndex={currentIndex} onIndexChange={setCurrentIndex}
                isPlaying={isPlaying} onTogglePlay={handleTogglePlay}
                currentTime={currentTime} duration={duration} onSeek={(t) => { if(audioRef.current) audioRef.current.currentTime = t; }}
                audioRef={audioRef} playbackMode={playbackMode} onModeChange={setPlaybackMode}
              />
            )}
            {currentView === ViewMode.DISCOVERY && <Discovery onPlaySong={(s) => { const exists = songs.findIndex(x => x.id === s.id); if(exists !== -1) setCurrentIndex(exists); else { setSongs(p => [s, ...p]); setCurrentIndex(0); } setCurrentView(ViewMode.PLAYER); setIsPlaying(false); }} onNotify={pushNotification} />}
            {currentView === ViewMode.MANAGER && <MusicManager songs={songs} videos={videos} onRefresh={loadResources} onNotify={pushNotification} onViewDetails={(s) => { setSelectedSong(s); setCurrentView(ViewMode.SONG_DETAILS); }} onViewVideoDetails={(v) => { setSelectedVideo(v); setCurrentView(ViewMode.VIDEO_DETAILS); }} />}
            {currentView === ViewMode.VIDEO && <VideoSection shared={isSharedMode} onPlayVideo={() => audioRef.current?.pause()} onNotify={pushNotification} onViewDetails={(v) => { setSelectedVideo(v); setCurrentView(ViewMode.VIDEO_DETAILS); }} />}
            {currentView === ViewMode.API_DOCS && <ApiDocs />}
            {currentView === ViewMode.SETTINGS && <Settings isHighContrast={isHighContrast} onToggleContrast={() => setIsHighContrast(!isHighContrast)} brightness={brightness} onBrightnessChange={setBrightness} hotkeySettings={hotkeySettings} onHotkeyChange={setHotkeySettings} />}
            {currentView === ViewMode.CACHE_SPACE && <CacheSpace />}
            {currentView === ViewMode.SONG_DETAILS && selectedSong && <SongDetails song={selectedSong} onBack={() => setCurrentView(ViewMode.MANAGER)} onUpdate={() => loadResources()} onNotify={pushNotification} />}
            {currentView === ViewMode.VIDEO_DETAILS && selectedVideo && <VideoDetails video={selectedVideo} onBack={() => setCurrentView(ViewMode.VIDEO)} onUpdate={() => loadResources()} onNotify={pushNotification} />}
          </div>
        )}
      </main>

      <audio 
        ref={audioRef} src={activeAudioUrl} crossOrigin="anonymous"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => playbackMode === PlaybackMode.REPEAT_ONE ? (audioRef.current && (audioRef.current.currentTime = 0, audioRef.current.play())) : nextSong()}
        autoPlay={currentIndex !== 0 || isPlaying} 
      />
    </div>
  );
};

export default App;
