
import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { Song, Video, ViewMode, PlaybackMode, AppNotification, NotificationType } from './types';
import { fetchSongs, fetchVideos } from './services/s3Service';
import MusicPlayer from './components/MusicPlayer';
import ErrorNotification from './components/ErrorNotification';
import GlobalSearchModal from './components/GlobalSearchModal';

const Discovery = lazy(() => import('./components/Discovery'));
const MusicManager = lazy(() => import('./components/MusicManager'));
const VideoSection = lazy(() => import('./components/VideoSection'));
const ApiDocs = lazy(() => import('./components/ApiDocs'));
const SongDetails = lazy(() => import('./components/SongDetails'));
const Settings = lazy(() => import('./components/Settings'));

const AuroraLoader = () => (
  <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-pulse">
    <div className="w-10 h-10 border-2 border-white/20 border-t-red-500 rounded-full animate-spin"></div>
    <p className="font-bold text-xs uppercase tracking-widest text-white/60 italic">正在接收信号...</p>
  </div>
);

const Logo: React.FC<{ isPlaying?: boolean }> = ({ isPlaying }) => (
  <div className="relative group cursor-pointer">
    <div className={`absolute inset-0 bg-red-600/40 blur-2xl rounded-full transition-all duration-[2000ms] ${isPlaying ? 'scale-125 opacity-60 animate-pulse' : 'scale-100 opacity-20'}`}></div>
    <div className={`relative w-14 h-14 flex items-center justify-center transition-all duration-700 ${isPlaying ? 'scale-110' : 'scale-100'}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
        <circle cx="50" cy="50" r="45" fill="#000" stroke="#E60026" strokeWidth="2" />
        <circle cx="50" cy="50" r="15" fill="#E60026" className={isPlaying ? 'animate-pulse' : ''} />
      </svg>
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.PLAYER);
  const [songs, setSongs] = useState<Song[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [isSharedMode, setIsSharedMode] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>(PlaybackMode.SEQUENCE);
  const [activeAudioUrl, setActiveAudioUrl] = useState<string>('');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const audioRef = useRef<HTMLAudioElement>(null);

  const pushNotification = useCallback((message: string, type: NotificationType = 'error') => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'shared') setIsSharedMode(true);
    loadResources();
    const timer = setTimeout(() => setShowIntro(false), 4500);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsSearchOpen(true); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => { clearTimeout(timer); window.removeEventListener('keydown', handleKeyDown); };
  }, []);

  useEffect(() => {
    if (songs[currentIndex]) {
      setActiveAudioUrl(songs[currentIndex].url);
    }
  }, [currentIndex, songs]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const loadResources = async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const [fs, fv] = await Promise.all([fetchSongs(), fetchVideos()]);
      setSongs(fs); setVideos(fv);
      if (fs.length === 0 && fv.length === 0) setLoadError(true);
    } catch (e) { 
      setLoadError(true);
      pushNotification("云端资源加载失败，请检查网络", "error"); 
    }
    setIsLoading(false);
  };

  const handleTogglePlay = useCallback(async () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { try { await audioRef.current.play(); setIsPlaying(true); } catch (err) { pushNotification("播放器启动失败", "error"); } }
  }, [isPlaying, pushNotification]);

  const menuItems = [
    { id: ViewMode.PLAYER, icon: 'fa-play', label: '正在播放' },
    { id: ViewMode.DISCOVERY, icon: 'fa-earth-asia', label: '搜索全网音乐' },
    { id: ViewMode.VIDEO, icon: 'fa-clapperboard', label: '精彩视频' },
    ...(isSharedMode ? [] : [{ id: ViewMode.MANAGER, icon: 'fa-shapes', label: '我的音乐库' }]),
    { id: ViewMode.API_DOCS, icon: 'fa-paper-plane', label: '链接分享' },
    { id: ViewMode.SETTINGS, icon: 'fa-sliders', label: '电台设置' }
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden p-2 md:p-6 gap-2 md:gap-4 bg-transparent text-white">
      
      {showIntro && (
        <div className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center animate-out fade-out duration-1000 delay-[3500ms]">
          <div className="max-w-xl px-12 space-y-10 text-center animate-in zoom-in-95 duration-[1500ms]">
            <p className="text-xs font-black uppercase tracking-[1em] text-red-500 mb-4">子夜电台</p>
            <p className="text-2xl md:text-3xl font-serif-quote font-black italic tracking-tighter leading-relaxed text-white">
              “我这辈子得到了很多空头支票，小时候爸妈答应买的玩具，恋人口中的永远。”
            </p>
            <div className="flex flex-col items-center space-y-3 opacity-80">
               <div className="w-16 h-[2px] bg-red-600"></div>
               <span className="text-[10px] font-black uppercase tracking-widest text-red-200">正在进入港湾...</span>
            </div>
          </div>
        </div>
      )}

      <ErrorNotification notifications={notifications} onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />
      
      {isSearchOpen && (
        <GlobalSearchModal 
          songs={songs} videos={videos} onClose={() => setIsSearchOpen(false)} 
          onPlaySong={(song) => {
            const idx = songs.findIndex(s => s.id === song.id);
            if (idx !== -1) setCurrentIndex(idx);
            setCurrentView(ViewMode.PLAYER); setIsSearchOpen(false);
          }}
          onPlayVideo={(video) => { setCurrentView(ViewMode.VIDEO); setIsSearchOpen(false); }}
        />
      )}

      {/* 侧边导航 */}
      <nav className="hidden md:flex w-64 h-full glass-dark-morphism rounded-[2.5rem] flex-col py-10 px-4 z-[100]">
        <div className="mb-10 px-4 flex items-center space-x-4">
          <Logo isPlaying={isPlaying} />
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter italic text-white">子夜电台</h1>
            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest italic">让遗憾有归宿</p>
          </div>
        </div>

        <div className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar">
          {menuItems.map(item => (
            <button 
              key={item.id} onClick={() => setCurrentView(item.id as ViewMode)} 
              className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all duration-300 font-bold text-xs ${currentView === item.id ? 'bg-red-600 text-white shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
            >
              <i className={`fa-solid ${item.icon} text-base w-6`}></i>
              <span className="tracking-widest uppercase">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* 主播放区 */}
      <main className="flex-1 glass-dark-morphism rounded-[2.5rem] relative overflow-hidden flex flex-col pb-24 md:pb-0 shadow-2xl">
        {loadError && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center space-y-8 z-[90] bg-black/60 backdrop-blur-xl">
             <i className="fa-solid fa-cloud-bolt text-5xl text-red-500"></i>
             <div className="space-y-3">
               <h3 className="text-xl font-black italic text-white">服务器连接超时</h3>
               <p className="text-white/60 text-xs font-bold">目前无法连接到云端存储，请检查网络或刷新重试。</p>
             </div>
             <button onClick={loadResources} className="px-10 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-2xl active:scale-95">重新加载数据</button>
          </div>
        )}

        <Suspense fallback={<AuroraLoader />}>
          {currentView === ViewMode.PLAYER && (
            <MusicPlayer 
              songs={songs} currentIndex={currentIndex} onIndexChange={setCurrentIndex}
              isPlaying={isPlaying} onTogglePlay={handleTogglePlay}
              currentTime={currentTime} duration={duration} onSeek={(t) => audioRef.current && (audioRef.current.currentTime = t)}
              audioRef={audioRef} playbackMode={playbackMode} onModeChange={setPlaybackMode}
              volume={volume} onVolumeChange={setVolume}
            />
          )}
          {currentView === ViewMode.DISCOVERY && <Discovery onPlaySong={(s) => { const exists = songs.findIndex(x => x.id === s.id); if(exists !== -1) setCurrentIndex(exists); else { setSongs(p => [s, ...p]); setCurrentIndex(0); } setCurrentView(ViewMode.PLAYER); setIsPlaying(false); }} onNotify={pushNotification} />}
          {currentView === ViewMode.MANAGER && <MusicManager songs={songs} videos={videos} onRefresh={loadResources} onNotify={pushNotification} onViewDetails={(s) => { setSelectedSong(s); setCurrentView(ViewMode.SONG_DETAILS); }} onViewVideoDetails={() => {}} />}
          {currentView === ViewMode.VIDEO && <VideoSection onPlayVideo={() => audioRef.current?.pause()} onNotify={pushNotification} />}
          {currentView === ViewMode.API_DOCS && <ApiDocs />}
          {currentView === ViewMode.SETTINGS && <Settings />}
          {currentView === ViewMode.SONG_DETAILS && selectedSong && <SongDetails song={selectedSong} onBack={() => setCurrentView(ViewMode.MANAGER)} onUpdate={() => loadResources()} onNotify={pushNotification} />}
        </Suspense>
      </main>

      <audio 
        ref={audioRef} src={activeAudioUrl} crossOrigin="anonymous"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => {
          if (playbackMode === PlaybackMode.REPEAT_ONE) {
            if(audioRef.current) audioRef.current.play();
          } else {
            const nextIdx = playbackMode === PlaybackMode.SHUFFLE ? Math.floor(Math.random() * songs.length) : (currentIndex + 1) % songs.length;
            setCurrentIndex(nextIdx);
          }
        }}
        autoPlay={currentIndex !== 0 || isPlaying} 
      />
    </div>
  );
};

export default App;
