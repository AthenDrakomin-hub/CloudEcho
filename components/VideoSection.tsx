
import React, { useState, useEffect, useRef } from 'react';
import { Video } from '../types';
import { fetchVideos, downloadVideo } from '../services/s3Service';

interface VideoSectionProps {
  onPlaySong?: (song: any) => void;
  shared?: boolean;
  onViewDetails?: (video: Video) => void;
  onPlayVideo?: () => void;
}

const VideoSection: React.FC<VideoSectionProps> = ({ onPlaySong, shared = false, onViewDetails, onPlayVideo }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [showControls, setShowControls] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const fetched = await fetchVideos();
      setVideos(fetched);
      if (fetched.length > 0 && !activeVideo) {
        setActiveVideo(fetched[0]);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadVideos(); }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimerRef.current) window.clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = window.setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const handleVideoClick = (video: Video) => {
    setActiveVideo(video);
    setIsPlaying(true);
    if (onPlayVideo) onPlayVideo();
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
      if (onPlayVideo) onPlayVideo();
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredVideos = videos.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden relative min-h-0 bg-transparent" onMouseMove={handleMouseMove}>
      {/* 沉浸式播放区 - 采用玻璃边框 */}
      <div 
        ref={containerRef}
        className="flex-[2.5] bg-black/5 relative flex items-center justify-center overflow-hidden min-h-0 rounded-[3rem] m-4 border border-white/50"
      >
        {activeVideo ? (
          <div className="w-full h-full relative group flex items-center justify-center">
            <video 
              key={activeVideo.url} 
              ref={videoRef} 
              src={activeVideo.url} 
              className="w-full h-full object-contain"
              autoPlay 
              playsInline
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              onClick={togglePlay}
            />
            
            <div className={`absolute top-0 left-0 right-0 p-8 flex items-center justify-between transition-all duration-500 z-30 bg-gradient-to-b from-white/20 to-transparent ${showControls ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex flex-col">
                 <h2 className="text-sm font-black text-zinc-900 italic truncate max-w-md">{activeVideo.name}</h2>
                 <span className="text-[9px] text-red-500 font-black uppercase tracking-[0.3em] mt-1">Memory Stream Terminal</span>
              </div>
            </div>

            <div className={`absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-white/30 to-transparent transition-all duration-500 z-30 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
              <div className="relative h-1.5 bg-black/5 rounded-full mb-6 cursor-pointer overflow-hidden">
                <input 
                  type="range" min="0" max={duration || 0} step="0.1" value={currentTime} 
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 z-40 cursor-pointer" 
                />
                <div className="absolute left-0 top-0 h-full bg-red-500 rounded-full z-20" style={{ width: `${(currentTime/duration)*100}%` }}></div>
              </div>

              <div className="flex items-center justify-between">
                <button onClick={togglePlay} className="text-zinc-900 text-xl active:scale-90 transition-all">
                  <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                </button>
                <span className="text-[10px] font-black text-zinc-500 tabular-nums">{formatTime(currentTime)} / {formatTime(duration)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-6 opacity-20">
            <i className="fa-solid fa-clapperboard text-6xl"></i>
            <p className="text-xs font-black uppercase tracking-widest">等待载入映画映射</p>
          </div>
        )}
      </div>

      {/* 右侧清单 - 毛玻璃适配 */}
      <div className="flex-1 border-l border-white/40 flex flex-col min-h-0">
        <div className="p-8 flex items-center justify-between">
           <div className="flex flex-col">
              <span className="text-xs font-black text-zinc-900 uppercase tracking-widest italic">映画清单</span>
              <span className="text-[9px] text-zinc-400 font-black uppercase mt-1 tracking-widest">{videos.length} 记录节点</span>
           </div>
           <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
        </div>
        
        <div className="px-8 pb-6">
          <input 
            type="text" placeholder="查找映画记录..." 
            className="w-full bg-white/40 border border-white/60 rounded-2xl py-3 px-6 text-[10px] font-black focus:bg-white outline-none transition-all" 
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} 
          />
        </div>

        <div className="flex-1 overflow-y-auto px-8 space-y-2 custom-scrollbar pb-12">
          {filteredVideos.map((v) => (
            <div 
              key={v.id} 
              onClick={() => handleVideoClick(v)} 
              className={`flex items-center space-x-4 p-5 rounded-2xl cursor-pointer transition-all border ${activeVideo?.id === v.id ? 'bg-white shadow-xl text-red-500 border-white' : 'hover:bg-white/40 border-transparent text-zinc-400'}`}
            >
              <i className={`fa-solid ${activeVideo?.id === v.id ? 'fa-play animate-pulse' : 'fa-circle-play'} text-xs`}></i>
              <div className="flex-1 truncate">
                <p className="text-[11px] font-black truncate">{v.name}</p>
                <p className="text-[8px] opacity-60 font-bold uppercase tracking-widest mt-1">ID: {v.id.slice(0, 8)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoSection;
