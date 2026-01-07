
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Song, Video, ViewMode, PlaybackMode, Playlist } from './types';
import { fetchSongs, getCachedMediaUrl } from './services/s3Service';
import MusicPlayer from './components/MusicPlayer';
import MusicManager from './components/MusicManager';
import VideoSection from './components/VideoSection';
import ApiDocs from './components/ApiDocs';
import SongDetails from './components/SongDetails';
import VideoDetails from './components/VideoDetails';
import Settings from './components/Settings';
import CacheSpace from './components/CacheSpace';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.PLAYER);
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharedMode, setIsSharedMode] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>(PlaybackMode.SEQUENCE);
  
  const [ambientRain, setAmbientRain] = useState(0); 
  const [ambientStatic, setAmbientStatic] = useState(0); 
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);

  // 缓存后的真实 URL
  const [activeAudioUrl, setActiveAudioUrl] = useState<string>('');

  const audioRef = useRef<HTMLAudioElement>(null);
  const rainRef = useRef<HTMLAudioElement>(null);
  const staticRef = useRef<HTMLAudioElement>(null);
  const timerIdRef = useRef<number | null>(null);
  const fadeOutRef = useRef<number | null>(null);
  const isTransitioningRef = useRef(false);

  const currentSong = songs[currentIndex];

  useEffect(() => {
    const savedPlaylists = localStorage.getItem('nocturne_playlists');
    if (savedPlaylists) {
      try {
        setPlaylists(JSON.parse(savedPlaylists));
      } catch (e) { console.error("歌单解析错误", e); }
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'shared') {
      setIsSharedMode(true);
      const viewParam = params.get('view');
      if (viewParam === 'video') setCurrentView(ViewMode.VIDEO);
    }
    
    loadSongs();
  }, []);

  // 核心：切歌时处理缓存逻辑
  useEffect(() => {
    if (currentSong) {
      getCachedMediaUrl(currentSong.id, currentSong.url).then(url => {
        setActiveAudioUrl(url);
      });
    }
  }, [currentSong]);

  useEffect(() => {
    if (sleepTimer !== null && sleepTimer > 0) {
      timerIdRef.current = window.setInterval(() => {
        setSleepTimer(prev => {
          if (prev === null || prev <= 1) {
            handleSleepEnd();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerIdRef.current) clearInterval(timerIdRef.current); };
  }, [sleepTimer]);

  const handleSleepEnd = () => {
    if (timerIdRef.current) clearInterval(timerIdRef.current);
    let currentVol = volume;
    fadeOutRef.current = window.setInterval(() => {
      currentVol -= 0.05;
      if (currentVol <= 0) {
        if (fadeOutRef.current) clearInterval(fadeOutRef.current);
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
        setVolume(0.8); 
        setSleepTimer(null);
      } else {
        setVolume(currentVol);
      }
    }, 200);
  };

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume;
    if (rainRef.current) rainRef.current.volume = ambientRain;
    if (staticRef.current) staticRef.current.volume = ambientStatic;
  }, [volume, isMuted, ambientRain, ambientStatic]);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn("自动续播由于浏览器策略失败:", error);
          setIsPlaying(false);
        });
      }
    }
    isTransitioningRef.current = false;
  }, [activeAudioUrl]); // 改为依赖 activeAudioUrl 确保地址转换后才尝试播放

  const handleTogglePlay = useCallback(async () => {
    if (!audioRef.current) return;
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
        if (rainRef.current && ambientRain > 0) rainRef.current.play();
        if (staticRef.current && ambientStatic > 0) staticRef.current.play();
      }
    } catch (err) {
      console.warn("手动播放失败:", err);
      setIsPlaying(false);
    }
  }, [isPlaying, ambientRain, ambientStatic]);

  const handleNext = useCallback((auto = false) => {
    if (songs.length === 0) return;
    
    isTransitioningRef.current = true;
    if (auto) setIsPlaying(true);

    let nextIndex = currentIndex;
    if (auto && playbackMode === PlaybackMode.REPEAT_ONE) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      isTransitioningRef.current = false;
      return;
    }

    if (playbackMode === PlaybackMode.SHUFFLE) {
      nextIndex = Math.floor(Math.random() * songs.length);
      if (songs.length > 1 && nextIndex === currentIndex) {
        nextIndex = (nextIndex + 1) % songs.length;
      }
    } else {
      nextIndex = (currentIndex + 1) % songs.length;
    }
    setCurrentIndex(nextIndex);
  }, [currentIndex, songs.length, playbackMode]);

  const stopMusic = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const loadSongs = async () => {
    setIsLoading(true);
    try {
      const fetchedSongs = await fetchSongs();
      setSongs(fetchedSongs);
      const sharedId = new URLSearchParams(window.location.search).get('id');
      if (sharedId) {
        const index = fetchedSongs.findIndex(s => s.id === sharedId);
        if (index !== -1) setCurrentIndex(index);
      }
    } catch (e) {
      console.error("加载云端资源失败", e);
    }
    setIsLoading(false);
  };

  const renderAudioEngine = () => (
    <>
      <audio 
        ref={audioRef} 
        src={activeAudioUrl} 
        crossOrigin="anonymous"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => handleNext(true)}
        onPlay={() => { if (!isTransitioningRef.current) setIsPlaying(true); }}
        onPause={() => {
          if (!isTransitioningRef.current && audioRef.current && !audioRef.current.seeking && audioRef.current.currentTime < audioRef.current.duration) {
             setIsPlaying(false);
          }
        }}
      />
      <audio ref={rainRef} src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" loop hidden />
      <audio ref={staticRef} src="https://www.soundjay.com/misc/sounds/vinyl-crackle-01.mp3" loop hidden />
    </>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#020202] flex-col md:flex-row text-white">
      <nav className="w-full md:w-64 h-[72px] md:h-full bg-black md:bg-[#050505] border-t md:border-t-0 md:border-r border-white/10 flex md:flex-col order-last md:order-first z-[100] flex-shrink-0">
        <div className="hidden md:flex items-center space-x-3 p-8 mb-4 min-w-0 overflow-hidden">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20 relative flex-shrink-0">
            <i className="fa-solid fa-cloud-moon text-white text-lg"></i>
            {sleepTimer !== null && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-white text-black rounded-full flex items-center justify-center text-[7px] font-black">
                {Math.ceil(sleepTimer / 60)}
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0 overflow-hidden">
            <span className="text-xl font-black tracking-tighter italic truncate">网忆云</span>
            <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5 truncate opacity-60">Late Night Habitat</span>
          </div>
        </div>

        <div className="flex-1 flex md:flex-col items-center md:items-stretch justify-around md:justify-start md:space-y-1 px-2 md:px-4 overflow-x-auto md:overflow-y-auto custom-scrollbar">
          <button 
            onClick={() => setCurrentView(ViewMode.PLAYER)} 
            className={`flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-4 p-3 rounded-2xl transition-all flex-shrink-0 md:flex-shrink ${currentView === ViewMode.PLAYER ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            <i className="fa-solid fa-play text-lg"></i>
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">播放器</span>
          </button>
          
          <button 
            onClick={() => setCurrentView(ViewMode.VIDEO)} 
            className={`flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-4 p-3 rounded-2xl transition-all flex-shrink-0 md:flex-shrink ${currentView === ViewMode.VIDEO ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            <i className="fa-solid fa-clapperboard text-lg"></i>
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">放映厅</span>
          </button>

          {!isSharedMode && (
            <button 
              onClick={() => setCurrentView(ViewMode.MANAGER)} 
              className={`flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-4 p-3 rounded-2xl transition-all flex-shrink-0 md:flex-shrink ${currentView === ViewMode.MANAGER ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
            >
              <i className="fa-solid fa-list-check text-lg"></i>
              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">管理</span>
            </button>
          )}

          <button 
            onClick={() => setCurrentView(ViewMode.API_DOCS)} 
            className={`flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-4 p-3 rounded-2xl transition-all flex-shrink-0 md:flex-shrink ${currentView === ViewMode.API_DOCS ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            <i className="fa-solid fa-share-nodes text-lg"></i>
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">分享</span>
          </button>

          {!isSharedMode && (
            <button 
              onClick={() => setCurrentView(ViewMode.CACHE_SPACE)} 
              className={`flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-4 p-3 rounded-2xl transition-all flex-shrink-0 md:flex-shrink ${currentView === ViewMode.CACHE_SPACE ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
            >
              <i className="fa-solid fa-database text-lg"></i>
              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">缓存</span>
            </button>
          )}

          {!isSharedMode && (
            <button 
              onClick={() => setCurrentView(ViewMode.SETTINGS)} 
              className={`flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-4 p-3 rounded-2xl transition-all flex-shrink-0 md:flex-shrink ${currentView === ViewMode.SETTINGS ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
            >
              <i className="fa-solid fa-gear text-lg"></i>
              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">设置</span>
            </button>
          )}
        </div>

        <div className="hidden md:block p-8 border-t border-white/5">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mb-2">System Status</p>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-zinc-300">Connected</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 relative overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-700">Connecting to Repository...</p>
          </div>
        ) : (
          <>
            {currentView === ViewMode.PLAYER && (
              <MusicPlayer 
                songs={songs}
                currentIndex={currentIndex}
                onIndexChange={setCurrentIndex}
                shared={isSharedMode}
                isPlaying={isPlaying}
                onTogglePlay={handleTogglePlay}
                currentTime={currentTime}
                duration={duration}
                onSeek={(t) => { if(audioRef.current) audioRef.current.currentTime = t; }}
                audioRef={audioRef}
                playbackMode={playbackMode}
                onModeChange={setPlaybackMode}
                volume={volume}
                onVolumeChange={setVolume}
                isMuted={isMuted}
                onToggleMute={() => setIsMuted(!isMuted)}
                ambientRain={ambientRain}
                onAmbientRainChange={setAmbientRain}
                ambientStatic={ambientStatic}
                onAmbientStaticChange={setAmbientStatic}
                sleepTimer={sleepTimer}
                onSleepTimerChange={setSleepTimer}
              />
            )}
            {currentView === ViewMode.MANAGER && (
              <MusicManager 
                songs={songs} 
                playlists={playlists}
                onUpdatePlaylists={setPlaylists}
                onRefresh={loadSongs}
                onViewDetails={(song) => {
                  setSelectedSong(song);
                  setCurrentView(ViewMode.SONG_DETAILS);
                }}
              />
            )}
            {currentView === ViewMode.VIDEO && (
              <VideoSection 
                shared={isSharedMode}
                onPlayVideo={stopMusic}
                onViewDetails={(video) => {
                  setSelectedVideo(video);
                  setCurrentView(ViewMode.VIDEO_DETAILS);
                }}
              />
            )}
            {currentView === ViewMode.API_DOCS && <ApiDocs />}
            {currentView === ViewMode.SETTINGS && <Settings />}
            {currentView === ViewMode.CACHE_SPACE && <CacheSpace />}
            {currentView === ViewMode.SONG_DETAILS && selectedSong && (
              <SongDetails 
                song={selectedSong} 
                onBack={() => setCurrentView(ViewMode.MANAGER)}
                onUpdate={(updated) => {
                  setSongs(songs.map(s => s.id === updated.id ? updated : s));
                  setSelectedSong(updated);
                }}
              />
            )}
            {currentView === ViewMode.VIDEO_DETAILS && selectedVideo && (
              <VideoDetails 
                video={selectedVideo} 
                onBack={() => setCurrentView(ViewMode.VIDEO)}
                onUpdate={(updated) => {
                   setSelectedVideo(updated);
                }}
              />
            )}
          </>
        )}
      </main>

      {renderAudioEngine()}
    </div>
  );
};

export default App;
