
import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { Song, Video, Playlist, ViewMode, PlaybackMode, AppNotification, NotificationType } from './types';
import { fetchSongs, fetchVideos } from './services/s3Service';
import { resolveMusicUrl } from './services/discoveryService';
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
const LiveSession = lazy(() => import('./components/LiveSession'));

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode | 'cache'>(ViewMode.PLAYER);
  const [songs, setSongs] = useState<Song[]>([]);
  const [activeQueue, setActiveQueue] = useState<Song[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
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

  const playSong = useCallback(async (song: Song, queue?: Song[]) => {
    setIsResolving(true);
    if (queue) setActiveQueue(queue);
    
    try {
        const realUrl = await resolveMusicUrl(song);
        const resolvedSong = { ...song, url: realUrl };
        
        setActiveQueue(prev => {
            const index = prev.findIndex(s => s.id === song.id);
            if (index !== -1) {
                const newQueue = [...prev];
                newQueue[index] = resolvedSong;
                return newQueue;
            }
            return [resolvedSong, ...prev];
        });

        setTimeout(async () => {
            if (audioRef.current) {
                audioRef.current.src = realUrl;
                try {
                    await audioRef.current.play();
                    setIsPlaying(true);
                    pushNotification(`正在为你捕获波段: ${song.name}`, "success");
                } catch (e) {
                    pushNotification("音频链路建立失败，可能版权受限", "error");
                }
            }
            setIsResolving(false);
        }, 100);

    } catch (e) {
        pushNotification("解析物理链路超时", "error");
        setIsResolving(false);
    }
  }, [pushNotification]);

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
        pushNotification("音频链路重载失败", "error"); 
      } 
    }
  }, [isPlaying, pushNotification]);

  const handleNext = useCallback(() => {
    if (activeQueue.length === 0) return;
    let nextIdx = 0;
    if (playbackMode === PlaybackMode.SHUFFLE) {
      nextIdx = Math.floor(Math.random() * activeQueue.length);
    } else {
      nextIdx = (currentIndex + 1) % activeQueue.length;
    }
    setCurrentIndex(nextIdx);
    playSong(activeQueue[nextIdx]);
  }, [activeQueue, playbackMode, currentIndex, playSong]);

  const handlePrev = useCallback(() => {
    if (activeQueue.length === 0) return;
    const prevIdx = (currentIndex - 1 + activeQueue.length) % activeQueue.length;
    setCurrentIndex(prevIdx);
    playSong(activeQueue[prevIdx]);
  }, [activeQueue, currentIndex, playSong]);

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
        pushNotification("云端同步超时，请检查配置", "error"); 
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
    { id: ViewMode.PLAYER, icon: 'fa-compact-disc', label: '正在回响' },
    { id: ViewMode.DISCOVERY, icon: 'fa-compass', label: '发现频率' },
    { id: ViewMode.LIVE, icon: 'fa-tower-broadcast', label: '子夜电台' },
    { id: ViewMode.COPYWRITING, icon: 'fa-comment-dots', label: '感悟墙' },
    { id: ViewMode.VIDEO, icon: 'fa-circle-play', label: '深夜映画' },
    { id: ViewMode.MANAGER, icon: 'fa-folder-open', label: '我的上传' },
    { id: 'cache', icon: 'fa-server', label: '内存颗粒' },
    { id: ViewMode.SETTINGS, icon: 'fa-gear', label: '偏好设置' }
  ];

  return (
    <div className="h-full w-full overflow-hidden flex items-center justify-center bg-transparent">
      {/* 整体缩小 10% 方案：桌面端 scale-90，并由于占据空间不变，使用 w-[111.11%] 补偿全屏 */}
      <div className="flex flex-col md:flex-row h-full w-full max-w-[100vw] transition-transform duration-700 ease-out origin-center md:scale-[0.9] md:w-[111.11vw] md:h-[111.11vh] shrink-0">
        <ErrorNotification notifications={notifications} onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />
        
        {isSearchOpen && (
          <GlobalSearchModal 
            songs={songs} videos={videos} onClose={() => setIsSearchOpen(false)} 
            onPlaySong={(song) => { playSong(song, songs); setCurrentView(ViewMode.PLAYER); setIsSearchOpen(false); }}
            onPlayVideo={(video) => { setActiveVideo(video); setCurrentView(ViewMode.VIDEO); setIsSearchOpen(false); }}
          />
        )}

        {isResolving && (
            <div className="fixed inset-0 z-[4000] bg-black/85 backdrop-blur-3xl flex flex-col items-center justify-center space-y-12 animate-in fade-in duration-500">
               <div className="relative">
                  <div className="w-36 h-36 border-4 border-red-600/50 rounded-full animate-ping absolute inset-0"></div>
                  <div className="w-36 h-36 border-t-4 border-white rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                      <i className="fa-solid fa-satellite text-white text-4xl animate-pulse high-light"></i>
                  </div>
               </div>
               <div className="text-center space-y-4">
                  <p className="text-2xl font-black italic aurora-text high-light">正在对齐音频相位</p>
                  <p className="text-[12px] font-bold text-white uppercase tracking-[0.6em] high-light">Establishing High-Fidelity Mapping...</p>
               </div>
            </div>
        )}

        {/* 找回并强化的品牌侧边导航栏 */}
        <nav className="fixed bottom-0 left-0 right-0 md:relative md:w-24 lg:w-80 h-16 md:h-[94vh] md:my-[3vh] md:ml-6 bg-black/60 backdrop-blur-3xl border-2 border-white/40 md:rounded-[3rem] z-[100] flex md:flex-col items-center py-4 md:py-14 shadow-[0_40px_80px_rgba(0,0,0,0.9)]">
          {/* 品牌 Logo 区域 */}
          <div className="hidden md:flex flex-col items-center mb-16 px-4">
            <div className="w-16 h-16 rounded-[1.8rem] bg-gradient-to-br from-[#C20C0C] to-red-900 flex items-center justify-center text-3xl shadow-2xl shadow-red-900/60 animate-pulse border-2 border-white/40">
              <i className="fa-solid fa-cloud text-white"></i>
            </div>
            <div className="mt-8 text-center">
              <p className="hidden lg:block text-[15px] font-black italic tracking-[0.8em] aurora-text high-light">子夜 · 回响</p>
              <p className="hidden lg:block mt-1 text-[8px] font-black text-white/50 uppercase tracking-[0.3em] high-light">Nocturne Echo</p>
            </div>
          </div>
          
          <div className="flex-1 flex md:flex-col justify-around md:justify-start items-center gap-2 md:gap-6 w-full">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as any)}
                className={`flex flex-col md:flex-row items-center gap-4 px-6 md:px-10 py-4 rounded-2xl transition-all border-2 ${currentView === item.id ? 'bg-white text-black border-white shadow-2xl scale-110' : 'text-white border-transparent hover:bg-white/10 hover:border-white/20'}`}
              >
                <i className={`fa-solid ${item.icon} text-xl ${currentView === item.id ? 'text-black' : 'text-white'}`}></i>
                <span className={`hidden lg:block text-[12px] font-black uppercase tracking-widest ${currentView === item.id ? 'text-black' : 'text-white high-light'}`}>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* 主内容区域 */}
        <main className="flex-1 relative overflow-hidden md:my-[3vh] md:mr-6 bg-black/50 backdrop-blur-xl md:rounded-[3.5rem] border-2 border-white/40 shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
          <Suspense fallback={
            <div className="h-full flex flex-col items-center justify-center space-y-6">
              <i className="fa-solid fa-spinner animate-spin text-5xl text-white"></i>
              <p className="text-[12px] font-black uppercase tracking-widest text-white high-light">Loading Frequency Nodes...</p>
            </div>
          }>
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
                onSeek={(time: number) => { if (audioRef.current) audioRef.current.currentTime = time; }}
                playbackMode={playbackMode}
                onModeChange={setPlaybackMode}
                volume={volume}
                onVolumeChange={setVolume}
              />
            )}
            {currentView === ViewMode.DISCOVERY && <Discovery onPlaySong={playSong} onNotify={pushNotification} />}
            {currentView === ViewMode.LIVE && <LiveSession />}
            {currentView === ViewMode.COPYWRITING && <CopywritingWall onNotify={pushNotification} />}
            {currentView === ViewMode.VIDEO && <VideoSection externalActiveVideo={activeVideo} onNotify={pushNotification} />}
            {currentView === ViewMode.MANAGER && (
              <MusicManager 
                songs={songs} 
                videos={videos} 
                onRefresh={async () => {
                  const [fs, fv] = await Promise.all([fetchSongs(), fetchVideos()]);
                  setSongs(fs);
                  setVideos(fv);
                }} 
                onNotify={pushNotification}
                onViewDetails={(s: Song) => { setSelectedSong(s); setCurrentView(ViewMode.SONG_DETAILS); }}
                onViewVideoDetails={(v: Video) => { setActiveVideo(v); setCurrentView(ViewMode.VIDEO_DETAILS); }}
                onViewPlaylist={(p: Playlist) => { setSelectedPlaylist(p); setCurrentView(ViewMode.PLAYLIST_DETAIL); }}
              />
            )}
            {currentView === 'cache' && <CacheSpace />}
            {currentView === ViewMode.SETTINGS && <Settings />}
            {currentView === ViewMode.SONG_DETAILS && selectedSong && (
              <SongDetails 
                song={selectedSong} 
                onBack={() => setCurrentView(ViewMode.MANAGER)} 
                onUpdate={(s) => setSongs(prev => prev.map(old => old.id === s.id ? s : old))}
                onNotify={pushNotification}
              />
            )}
            {currentView === ViewMode.VIDEO_DETAILS && activeVideo && (
              <VideoDetails 
                video={activeVideo} 
                onBack={() => setCurrentView(ViewMode.MANAGER)} 
                onUpdate={(v) => setVideos(prev => prev.map(old => old.id === v.id ? v : old))}
                onNotify={pushNotification}
              />
            )}
            {currentView === ViewMode.PLAYLIST_DETAIL && selectedPlaylist && (
              <PlaylistDetail 
                playlist={selectedPlaylist} 
                allSongs={songs}
                onBack={() => setCurrentView(ViewMode.MANAGER)}
                onPlaySong={playSong}
                onNotify={pushNotification}
                onUpdate={() => {
                   fetchSongs().then(setSongs);
                }}
              />
            )}
          </Suspense>
        </main>

        <audio 
          ref={audioRef}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onDurationChange={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={handleAudioEnded}
          onError={() => pushNotification("音频资源载入中断", "error")}
        />
      </div>
    </div>
  );
};

export default App;
