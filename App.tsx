
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Song, ViewMode, PlaybackMode, Playlist } from './types';
import { fetchSongs } from './services/s3Service';
import MusicPlayer from './components/MusicPlayer';
import MusicManager from './components/MusicManager';
import VideoSection from './components/VideoSection';
import ApiDocs from './components/ApiDocs';
import SongDetails from './components/SongDetails';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.PLAYER);
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharedMode, setIsSharedMode] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>(PlaybackMode.SEQUENCE);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentSong = songs[currentIndex];

  useEffect(() => {
    const savedPlaylists = localStorage.getItem('nocturne_playlists');
    if (savedPlaylists) {
      try {
        setPlaylists(JSON.parse(savedPlaylists));
      } catch (e) {
        console.error("Failed to parse playlists", e);
      }
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'shared') {
      setIsSharedMode(true);
      // 分享模式默认视图可以是 PLAYER 或 VIDEO，根据参数决定
      const view = params.get('view');
      if (view === 'video') setCurrentView(ViewMode.VIDEO);
    }
    loadSongs();
  }, []);

  useEffect(() => {
    localStorage.setItem('nocturne_playlists', JSON.stringify(playlists));
  }, [playlists]);

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
      console.error("加载曲库失败", e);
    }
    setIsLoading(false);
  };

  const handleTogglePlay = useCallback(async () => {
    if (!audioRef.current) return;
    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
    } catch (err) {
      console.warn("播放尝试被拦截，请手动交互:", err);
      setIsPlaying(false);
    }
  }, [isPlaying]);

  const handleNext = useCallback((auto = false) => {
    if (songs.length === 0) return;
    let nextIndex = currentIndex;
    
    if (auto && playbackMode === PlaybackMode.REPEAT_ONE) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
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

  const handlePrev = useCallback(() => {
    if (songs.length === 0) return;
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    setCurrentIndex(prevIndex);
  }, [currentIndex, songs.length]);

  const handleUpdatePlaylists = (newPlaylists: Playlist[]) => {
    setPlaylists(newPlaylists);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [currentIndex]);

  const renderAudioEngine = () => (
    <audio 
      ref={audioRef} 
      src={currentSong?.url} 
      crossOrigin="anonymous"
      onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
      onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      onEnded={() => handleNext(true)}
      onPlay={() => setIsPlaying(true)}
      onPause={() => setIsPlaying(false)}
    />
  );

  if (isSharedMode) {
    return (
      <div className="h-screen w-screen bg-[#020202] flex flex-col overflow-hidden text-white">
        <header className="h-16 px-8 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-3xl z-[100] fixed top-0 left-0 right-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-music text-white text-xs"></i>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black tracking-widest uppercase">Nocturne Space</span>
              <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-tighter">Private Shared Station</span>
            </div>
          </div>
          
          <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/5">
            <button 
              onClick={() => setCurrentView(ViewMode.PLAYER)}
              className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${currentView === ViewMode.PLAYER ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              子夜旋律
            </button>
            <button 
              onClick={() => setCurrentView(ViewMode.VIDEO)}
              className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${currentView === ViewMode.VIDEO ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              深夜映画
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-2">
             <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
             <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Live Now</span>
          </div>
        </header>

        <main className="flex-1 mt-16 overflow-hidden flex flex-col relative">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
               <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {currentView === ViewMode.PLAYER && (
                <MusicPlayer 
                  songs={songs} currentIndex={currentIndex} onIndexChange={setCurrentIndex} shared={true}
                  isPlaying={isPlaying} onTogglePlay={handleTogglePlay} currentTime={currentTime} duration={duration}
                  onSeek={(t) => audioRef.current && (audioRef.current.currentTime = t)} audioRef={audioRef}
                  playbackMode={playbackMode} onModeChange={setPlaybackMode}
                />
              )}
              {currentView === ViewMode.VIDEO && (
                <VideoSection shared={true} />
              )}
            </>
          )}
        </main>
        {renderAudioEngine()}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#020202] flex-col md:flex-row text-white">
      <nav className="w-full md:w-64 h-[72px] md:h-full bg-black md:bg-[#050505] border-t md:border-t-0 md:border-r border-white/10 flex md:flex-col order-last md:order-first z-[100] safe-area-bottom">
        <div className="hidden md:flex items-center space-x-3 p-8 mb-4">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
            <i className="fa-solid fa-headphones-simple text-white text-lg"></i>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tighter text-white">网易云 DJ</span>
            <span className="text-[8px] text-red-600 font-black tracking-widest uppercase">Management</span>
          </div>
        </div>

        <div className="flex-1 flex md:flex-col items-center md:items-stretch justify-around md:justify-start md:space-y-2 px-2 md:px-6">
          <button onClick={() => setCurrentView(ViewMode.PLAYER)} className={`flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-4 px-4 py-2 md:py-4 rounded-2xl transition-all ${currentView === ViewMode.PLAYER ? 'text-red-600 md:bg-red-600/10 md:text-white' : 'text-zinc-500 hover:text-white'}`}>
            <i className={`fa-solid fa-compact-disc text-xl md:text-base ${currentView === ViewMode.PLAYER ? 'animate-spin-slow' : ''}`}></i>
            <span className="text-[10px] md:text-sm font-bold">正在播放</span>
          </button>
          <button onClick={() => setCurrentView(ViewMode.VIDEO)} className={`flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-4 px-4 py-2 md:py-4 rounded-2xl transition-all ${currentView === ViewMode.VIDEO ? 'text-red-600 md:bg-red-600/10 md:text-white' : 'text-zinc-500 hover:text-white'}`}>
            <i className="fa-solid fa-video text-xl md:text-base"></i>
            <span className="text-[10px] md:text-sm font-bold">精选视频</span>
          </button>
          <button onClick={() => setCurrentView(ViewMode.MANAGER)} className={`flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-4 px-4 py-2 md:py-4 rounded-2xl transition-all ${currentView === ViewMode.MANAGER || currentView === ViewMode.SONG_DETAILS ? 'text-red-600 md:bg-red-600/10 md:text-white' : 'text-zinc-500 hover:text-white'}`}>
            <i className="fa-solid fa-layer-group text-xl md:text-base"></i>
            <span className="text-[10px] md:text-sm font-bold">我的曲库</span>
          </button>
          <button onClick={() => setCurrentView(ViewMode.API_DOCS)} className={`flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-4 px-4 py-2 md:py-4 rounded-2xl transition-all ${currentView === ViewMode.API_DOCS ? 'text-red-600 md:bg-red-600/10 md:text-white' : 'text-zinc-500 hover:text-white'}`}>
            <i className="fa-solid fa-link text-xl md:text-base"></i>
            <span className="text-[10px] md:text-sm font-bold">分享链接</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 relative overflow-hidden flex flex-col bg-[#020202] pb-[72px] md:pb-0">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
             <div className="w-10 h-10 border-2 border-zinc-900 border-t-red-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {currentView === ViewMode.PLAYER && (
              <MusicPlayer 
                songs={songs} currentIndex={currentIndex} onIndexChange={setCurrentIndex} isPlaying={isPlaying} 
                onTogglePlay={handleTogglePlay} currentTime={currentTime} duration={duration} 
                onSeek={(t) => audioRef.current && (audioRef.current.currentTime = t)} audioRef={audioRef}
                playbackMode={playbackMode} onModeChange={setPlaybackMode}
              />
            )}
            {currentView === ViewMode.VIDEO && <VideoSection shared={isSharedMode} />}
            {currentView === ViewMode.MANAGER && (
              <MusicManager 
                songs={songs} 
                playlists={playlists}
                onUpdatePlaylists={handleUpdatePlaylists}
                onRefresh={loadSongs} 
                onViewDetails={(s) => { setSelectedSong(s); setCurrentView(ViewMode.SONG_DETAILS); }} 
              />
            )}
            {currentView === ViewMode.API_DOCS && <ApiDocs />}
            {currentView === ViewMode.SONG_DETAILS && selectedSong && (
              <SongDetails song={selectedSong} onBack={() => { setCurrentView(ViewMode.MANAGER); loadSongs(); }} onUpdate={(s) => setSongs(songs.map(item => item.id === s.id ? s : item))} />
            )}
          </>
        )}
      </main>

      {!isLoading && currentSong && currentView !== ViewMode.PLAYER && (
        <div className="fixed bottom-[72px] md:bottom-0 left-0 md:left-64 right-0 h-16 md:h-20 bg-black/90 backdrop-blur-3xl border-t border-white/5 px-4 md:px-8 flex items-center justify-between z-[90]">
          <div className="flex items-center space-x-3 w-2/3 md:w-1/4" onClick={() => setCurrentView(ViewMode.PLAYER)}>
            <img src={currentSong.coverUrl} className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover shadow-lg" />
            <div className="truncate flex flex-col">
              <p className="text-xs md:text-sm font-black truncate text-white">{currentSong.name}</p>
              <p className="text-[9px] text-zinc-500 truncate uppercase font-bold">{currentSong.artist}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 md:space-x-8">
            <button onClick={handlePrev} className="hidden md:block text-zinc-500 hover:text-white"><i className="fa-solid fa-backward-step text-lg"></i></button>
            <button onClick={handleTogglePlay} className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black active:scale-90 transition-all shadow-lg">
              <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play ml-0.5'}`}></i>
            </button>
            <button onClick={() => handleNext()} className="text-zinc-500 hover:text-white"><i className="fa-solid fa-forward-step text-lg"></i></button>
          </div>
        </div>
      )}

      {renderAudioEngine()}
    </div>
  );
};

export default App;
