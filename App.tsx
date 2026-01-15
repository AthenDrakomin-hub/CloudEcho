
import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { Song, Video, Playlist, ViewMode, PlaybackMode, AppNotification, NotificationType } from './types';
import { fetchSongs, fetchVideos } from './services/s3Service';
import MusicPlayer from './components/MusicPlayer';
import ErrorNotification from './components/ErrorNotification';
import GlobalSearchModal from './components/GlobalSearchModal';

const Discovery = lazy(() => import('./components/Discovery'));
const MusicManager = lazy(() => import('./components/MusicManager'));
const VideoSection = lazy(() => import('./components/VideoSection'));
const Settings = lazy(() => import('./components/Settings'));
const CopywritingWall = lazy(() => import('./components/CopywritingWall'));
const SongDetails = lazy(() => import('./components/SongDetails'));
const VideoDetails = lazy(() => import('./components/VideoDetails'));
const PlaylistDetail = lazy(() => import('./components/PlaylistDetail'));
const CacheSpace = lazy(() => import('./components/CacheSpace'));

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.PLAYER);
  const [songs, setSongs] = useState<Song[]>([]);
  const [activeQueue, setActiveQueue] = useState<Song[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>(PlaybackMode.SEQUENCE);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const audioRef = useRef<HTMLAudioElement>(null);

  const pushNotification = useCallback((message: string, type: NotificationType = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3000);
  }, []);

  const handleTogglePlay = useCallback(async () => {
    if (!audioRef.current) return;
    if (isPlaying) { 
      audioRef.current.pause(); 
      setIsPlaying(false); 
    } else { 
      try { 
        await audioRef.current.play(); 
        setIsPlaying(true); 
      } catch { 
        pushNotification("播放轨道异常", "error"); 
      } 
    }
  }, [isPlaying, pushNotification]);

  const handleNext = useCallback(() => {
    if (activeQueue.length === 0) return;
    if (playbackMode === PlaybackMode.SHUFFLE) {
      const nextIdx = Math.floor(Math.random() * activeQueue.length);
      setCurrentIndex(nextIdx);
    } else {
      setCurrentIndex(prev => (prev + 1) % activeQueue.length);
    }
  }, [activeQueue, playbackMode]);

  const handlePrev = useCallback(() => {
    if (activeQueue.length === 0) return;
    setCurrentIndex(prev => (prev - 1 + activeQueue.length) % activeQueue.length);
  }, [activeQueue]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const loadResources = async () => {
      setIsLoading(true);
      try {
        const [fs, fv] = await Promise.all([fetchSongs(), fetchVideos()]);
        setSongs(fs); 
        setVideos(fv);
        if (activeQueue.length === 0) setActiveQueue(fs);
      } catch (e) { 
        pushNotification("云端同步失败", "error"); 
      }
      setIsLoading(false);
    };
    loadResources();

    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsSearchOpen(true); }
      if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); handleTogglePlay(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleTogglePlay, pushNotification]);

  const handleAudioEnded = () => {
    if (playbackMode === PlaybackMode.REPEAT_ONE) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      handleNext();
    }
  };

  const menuItems = [
    { id: ViewMode.PLAYER, icon: 'fa-compact-disc', label: '我的音乐' },
    { id: ViewMode.DISCOVERY, icon: 'fa-compass', label: '发现音乐' },
    { id: ViewMode.COPYWRITING, icon: 'fa-comment-dots', label: '云村感悟' },
    { id: ViewMode.VIDEO, icon: 'fa-circle-play', label: '精选视频' },
    { id: ViewMode.MANAGER, icon: 'fa-folder-open', label: '我的上传' },
    { id: 'cache', icon: 'fa-server', label: '本地缓存' },
    { id: ViewMode.SETTINGS, icon: 'fa-gear', label: '系统设置' }
  ];

  return (
    <div className="flex flex-col md:flex-row h-full w-full overflow-hidden text-white bg-black">
      <ErrorNotification notifications={notifications} onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />
      
      {isSearchOpen && (
        <GlobalSearchModal 
          songs={songs} videos={videos} onClose={() => setIsSearchOpen(false)} 
          onPlaySong={(song) => { setActiveQueue(songs); setCurrentIndex(songs.findIndex(s=>s.id===song.id)); setCurrentView(ViewMode.PLAYER); setIsPlaying(true); }}
          onPlayVideo={() => { setCurrentView(ViewMode.VIDEO); setIsSearchOpen(false); }}
        />
      )}

      <nav className="fixed bottom-0 left-0 right-0 md:relative md:w-20 lg:w-64 h-16 md:h-full bg-[#121212] border-t md:border-t-0 md:border-r border-white/5 z-[100] flex md:flex-col items-center py-4 md:py-10">
        <div className="hidden md:flex flex-col items-center mb-10">
          <div className="w-10 h-10 rounded-full bg-[#C20C0C] flex items-center justify-center text-xl shadow-lg shadow-red-900/40">
            <i className="fa-solid fa-cloud"></i>
          </div>
          <p className="hidden lg:block mt-4 text-xs font-black italic tracking-widest text-[#C20C0C]">NETEASE ECHO</p>
        </div>
        
        <div className="flex md:flex-col items-center justify-around w-full md:space-y-2">
          {menuItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => setCurrentView(item.id as any)} 
              className={`flex flex-col md:flex-row items-center md:w-full px-4 lg:px-8 py-3 transition-all duration-300 ${currentView === item.id ? 'text-[#C20C0C] border-b-2 md:border-b-0 md:border-l-4 border-[#C20C0C] bg-white/5' : 'text-white/40 hover:text-white'}`}
            >
              <i className={`fa-solid ${item.icon} text-lg lg:w-6`}></i>
              <span className="hidden lg:block ml-4 text-[11px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 relative overflow-hidden pb-16 md:pb-0">
        <Suspense fallback={<div className="flex-1 h-full flex items-center justify-center"><i className="fa-solid fa-compact-disc animate-spin text-4xl text-[#C20C0C]"></i></div>}>
          {currentView === ViewMode.PLAYER && (
            <MusicPlayer 
              songs={activeQueue} 
              currentIndex={currentIndex} 
              onIndexChange={setCurrentIndex}
              isPlaying={isPlaying} 
              onTogglePlay={handleTogglePlay}
              onNext={handleNext}
              onPrev={handlePrev}
              currentTime={currentTime} 
              duration={duration} 
              onSeek={(t: number) => audioRef.current && (audioRef.current.currentTime = t)}
              playbackMode={playbackMode} 
              onModeChange={setPlaybackMode}
              volume={volume} 
              onVolumeChange={setVolume}
            />
          )}
          {currentView === ViewMode.DISCOVERY && <Discovery onPlaySong={(s) => { setActiveQueue([s, ...songs]); setCurrentIndex(0); setCurrentView(ViewMode.PLAYER); setIsPlaying(true); }} onNotify={pushNotification} />}
          {currentView === ViewMode.COPYWRITING && <CopywritingWall onNotify={pushNotification} />}
          {currentView === ViewMode.VIDEO && <VideoSection onNotify={pushNotification} />}
          {currentView === ViewMode.MANAGER && (
            <MusicManager 
              songs={songs} videos={videos} onRefresh={() => window.location.reload()} onNotify={pushNotification} 
              onViewDetails={(s: Song) => { setSelectedSong(s); setCurrentView(ViewMode.SONG_DETAILS); }} 
              onViewVideoDetails={(v: Video) => { setSelectedVideo(v); setCurrentView(ViewMode.VIDEO_DETAILS); }}
              onViewPlaylist={(p: Playlist) => { setSelectedPlaylist(p); setCurrentView(ViewMode.PLAYLIST_DETAIL); }}
            />
          )}
          {currentView === ViewMode.SONG_DETAILS && selectedSong && (
            <SongDetails 
              song={selectedSong} onBack={() => setCurrentView(ViewMode.MANAGER)} 
              onUpdate={() => window.location.reload()} onNotify={pushNotification} 
            />
          )}
          {currentView === ViewMode.VIDEO_DETAILS && selectedVideo && (
            <VideoDetails 
              video={selectedVideo} onBack={() => setCurrentView(ViewMode.MANAGER)} 
              onUpdate={() => window.location.reload()} onNotify={pushNotification} 
            />
          )}
          {currentView === ViewMode.PLAYLIST_DETAIL && selectedPlaylist && (
            <PlaylistDetail 
              playlist={selectedPlaylist} allSongs={songs} onBack={() => setCurrentView(ViewMode.MANAGER)}
              onPlaySong={(s, q) => { setActiveQueue(q); setCurrentIndex(q.indexOf(s)); setIsPlaying(true); setCurrentView(ViewMode.PLAYER); }}
              onNotify={pushNotification} onUpdate={() => window.location.reload()}
            />
          )}
          {(currentView as string) === 'cache' && <CacheSpace />}
          {currentView === ViewMode.SETTINGS && <Settings />}
        </Suspense>
      </main>

      <audio 
        ref={audioRef} 
        src={activeQueue[currentIndex]?.url} 
        crossOrigin="anonymous"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={handleAudioEnded}
        autoPlay={isPlaying} 
      />
    </div>
  );
};

export default App;
