
import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { Song, Video, ViewMode, PlaybackMode, AppNotification, NotificationType } from './types';
import { fetchSongs, fetchVideos, getCachedMediaUrl } from './services/s3Service';
import MusicPlayer from './components/MusicPlayer';
import ErrorNotification from './components/ErrorNotification';

// 极致动态导入
const Discovery = lazy(() => import('./components/Discovery'));
const MusicManager = lazy(() => import('./components/MusicManager'));
const VideoSection = lazy(() => import('./components/VideoSection'));
const ApiDocs = lazy(() => import('./components/ApiDocs'));
const SongDetails = lazy(() => import('./components/SongDetails'));
const Settings = lazy(() => import('./components/Settings'));

const AuroraLoader = () => (
  <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-pulse">
    <div className="w-10 h-10 border-2 border-white/5 border-t-indigo-500 rounded-full animate-spin"></div>
    <p className="font-black text-[7px] uppercase tracking-[1em] text-white/20 italic">正在校准浪子的频率...</p>
  </div>
);

const Logo: React.FC<{ isPlaying?: boolean }> = ({ isPlaying }) => (
  <div className="relative group cursor-pointer perspective-1000">
    <div className={`absolute inset-0 bg-indigo-600/30 blur-3xl rounded-full transition-all duration-[2000ms] ${isPlaying ? 'scale-150 opacity-60 animate-pulse' : 'scale-100 opacity-10'}`}></div>
    <div className={`relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center transition-all duration-700 group-hover:rotate-y-12 ${isPlaying ? 'scale-110' : 'scale-100'}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_10px_30px_rgba(99,102,241,0.5)]">
        <circle cx="50" cy="50" r="45" fill="#000" stroke="#6366f1" strokeWidth="1" />
        <circle cx="50" cy="50" r="15" fill="#6366f1" className={isPlaying ? 'animate-pulse' : ''} />
        {isPlaying && (
           <circle cx="50" cy="50" r="35" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="2, 6" className="animate-[spin_20s_linear_infinite]" />
        )}
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
  const [showIntro, setShowIntro] = useState(true);
  const [isSharedMode, setIsSharedMode] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>(PlaybackMode.SEQUENCE);
  const [activeAudioUrl, setActiveAudioUrl] = useState<string>('');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const audioRef = useRef<HTMLAudioElement>(null);

  const pushNotification = useCallback((message: string, type: NotificationType = 'error') => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'shared') setIsSharedMode(true);
    loadResources();
    const timer = setTimeout(() => setShowIntro(false), 4500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (songs[currentIndex]) {
      const song = songs[currentIndex];
      setActiveAudioUrl(song.url);
    }
  }, [currentIndex, songs]);

  const loadResources = async () => {
    setIsLoading(true);
    try {
      const [fs, fv] = await Promise.all([fetchSongs(), fetchVideos()]);
      setSongs(fs); setVideos(fv);
    } catch (e) { pushNotification("云端信号丢失", "error"); }
    setIsLoading(false);
  };

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
        pushNotification("频率建立失败", "error");
      }
    }
  }, [isPlaying, pushNotification]);

  const menuItems = [
    { id: ViewMode.PLAYER, icon: 'fa-play', label: '子夜播放' },
    { id: ViewMode.DISCOVERY, icon: 'fa-earth-asia', label: '信号搜索' },
    { id: ViewMode.VIDEO, icon: 'fa-clapperboard', label: '异乡映画' },
    ...(isSharedMode ? [] : [
      { id: ViewMode.MANAGER, icon: 'fa-shapes', label: '轨迹管理' },
    ]),
    { id: ViewMode.API_DOCS, icon: 'fa-paper-plane', label: '分享中心' },
    { id: ViewMode.SETTINGS, icon: 'fa-sliders', label: '偏好调节' }
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden p-2 md:p-6 gap-2 md:gap-6 bg-transparent text-white">
      
      {showIntro && (
        <div className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center animate-out fade-out duration-1000 delay-[3500ms]">
          <div className="max-w-xl px-12 space-y-10 text-center animate-in zoom-in-95 fade-in duration-[1500ms]">
            <p className="text-[10px] font-black uppercase tracking-[1em] text-indigo-500/60 mb-4">东南亚深夜电台 · 浪子港湾</p>
            <p className="text-2xl md:text-3xl font-serif-quote font-black italic tracking-tighter leading-relaxed text-white drop-shadow-2xl">
              “我这辈子得到了很多空头支票，小时候爸妈答应买的玩具，恋人口中的永远。”
            </p>
            <div className="flex flex-col items-center space-y-3 opacity-30">
               <div className="w-16 h-[1px] bg-indigo-600"></div>
               <span className="text-[9px] font-black uppercase tracking-[0.6em]">给每一个异乡的灵魂</span>
            </div>
          </div>
        </div>
      )}

      <ErrorNotification notifications={notifications} onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />
      
      <nav className="hidden md:flex w-72 h-full glass-dark-morphism rounded-[3.5rem] flex-col py-12 px-6 z-[100]">
        <div className="mb-14 px-4 flex items-center space-x-6">
          <Logo isPlaying={isPlaying} />
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tighter italic text-white leading-tight">子夜电台</h1>
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] italic">Southeast Asia</p>
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
          {menuItems.map(item => (
            <button 
              key={item.id} onClick={() => setCurrentView(item.id)} 
              className={`w-full flex items-center space-x-5 p-5 rounded-3xl transition-all duration-300 font-black text-[11px] ${currentView === item.id ? 'bg-white text-black shadow-[0_20px_40px_rgba(0,0,0,0.5)] scale-105' : 'text-white/20 hover:bg-white/5 hover:text-white'}`}
            >
              <i className={`fa-solid ${item.icon} text-lg`}></i>
              <span className="tracking-[0.2em] uppercase">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto pt-10 px-4">
           <div className="bg-indigo-600/5 rounded-2xl p-6 border border-indigo-600/10 text-center">
              <span className="text-[9px] font-black text-indigo-500/50 tracking-widest italic uppercase">浪子归宿模式已激活</span>
           </div>
        </div>
      </nav>

      <main className="flex-1 glass-dark-morphism rounded-[3rem] md:rounded-[4rem] relative overflow-hidden flex flex-col pb-24 md:pb-0 shadow-3xl">
        <Suspense fallback={<AuroraLoader />}>
          {currentView === ViewMode.PLAYER && (
            <MusicPlayer 
              songs={songs} currentIndex={currentIndex} onIndexChange={setCurrentIndex}
              isPlaying={isPlaying} onTogglePlay={handleTogglePlay}
              currentTime={currentTime} duration={duration} onSeek={(t) => { if(audioRef.current) audioRef.current.currentTime = t; }}
              audioRef={audioRef} playbackMode={playbackMode} onModeChange={setPlaybackMode}
            />
          )}
          {currentView === ViewMode.DISCOVERY && <Discovery onPlaySong={(s) => { const exists = songs.findIndex(x => x.id === s.id); if(exists !== -1) setCurrentIndex(exists); else { setSongs(p => [s, ...p]); setCurrentIndex(0); } setCurrentView(ViewMode.PLAYER); setIsPlaying(false); }} onNotify={pushNotification} />}
          {currentView === ViewMode.MANAGER && <MusicManager songs={songs} videos={videos} onRefresh={loadResources} onNotify={pushNotification} onViewDetails={(s) => { setSelectedSong(s); setCurrentView(ViewMode.SONG_DETAILS); }} onViewVideoDetails={() => {}} />}
          {currentView === ViewMode.VIDEO && <VideoSection onPlayVideo={() => audioRef.current?.pause()} onNotify={pushNotification} />}
          {currentView === ViewMode.API_DOCS && <ApiDocs />}
          {currentView === ViewMode.SETTINGS && <Settings onBrightnessChange={() => {}} />}
          {currentView === ViewMode.SONG_DETAILS && selectedSong && <SongDetails song={selectedSong} onBack={() => setCurrentView(ViewMode.MANAGER)} onUpdate={() => loadResources()} onNotify={pushNotification} />}
        </Suspense>
      </main>

      <audio 
        ref={audioRef} src={activeAudioUrl} crossOrigin="anonymous"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => {
          const nextIdx = playbackMode === PlaybackMode.SHUFFLE ? Math.floor(Math.random() * songs.length) : (currentIndex + 1) % songs.length;
          setCurrentIndex(nextIdx);
        }}
        autoPlay={currentIndex !== 0 || isPlaying} 
      />
    </div>
  );
};

export default App;
