
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
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [lastVolume, setLastVolume] = useState(0.8);
  
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

  const handleVolumeChange = (val: number) => {
    const fixedVal = Math.max(0, Math.min(1, val));
    setVolume(fixedVal);
    if (videoRef.current) {
      videoRef.current.volume = fixedVal;
      setIsMuted(fixedVal === 0);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredVideos = videos.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-[#020202] relative min-h-0" onMouseMove={handleMouseMove}>
      {/* 沉浸式播放区 */}
      <div 
        ref={containerRef}
        className="flex-[2.5] bg-black relative flex items-center justify-center overflow-hidden min-h-0"
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
            
            {/* 极简控制层 */}
            <div className={`absolute top-0 left-0 right-0 p-6 flex items-center justify-between transition-all duration-500 z-30 bg-gradient-to-b from-black/60 to-transparent ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
              <div className="flex flex-col">
                 <h2 className="text-xs font-black text-white italic truncate max-w-xs">{activeVideo.name}</h2>
                 <span className="text-[7px] text-red-600 font-black uppercase tracking-[0.2em] mt-0.5">深夜放映 · V-Space 映射</span>
              </div>
              <button onClick={() => containerRef.current?.requestFullscreen()} className="text-zinc-500 hover:text-white transition-colors">
                <i className="fa-solid fa-expand text-xs"></i>
              </button>
            </div>

            <div className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-all duration-500 z-30 ${showControls || !isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
              <div className="group/progress relative h-2 bg-white/5 rounded-full mb-4 cursor-pointer">
                <input 
                  type="range" min="0" max={duration || 0} step="0.1" value={currentTime} 
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 z-40 cursor-pointer" 
                />
                <div className="absolute left-0 top-0 h-full bg-red-600 rounded-full z-20" style={{ width: `${(currentTime/duration)*100}%` }}></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <button onClick={togglePlay} className="text-white text-base active:scale-90 transition-all">
                    <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                  </button>
                  <span className="text-[8px] font-mono text-zinc-500">{formatTime(currentTime)} / {formatTime(duration)}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <i className={`fa-solid ${volume === 0 ? 'fa-volume-xmark' : 'fa-volume-high'} text-[10px] text-zinc-500`}></i>
                  <div className="w-24 h-1.5 bg-white/10 rounded-full relative">
                    <input 
                      type="range" min="0" max="1" step="0.01" value={volume} 
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 z-40 cursor-pointer"
                    />
                    <div className="absolute left-0 top-0 h-full bg-red-600 rounded-full z-20" style={{ width: `${volume*100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4 text-zinc-800 italic">
            <i className="fa-solid fa-clapperboard text-4xl opacity-10"></i>
            <p className="text-[9px] font-black uppercase tracking-widest">请选择放映映射记录</p>
          </div>
        )}
      </div>

      {/* 右侧清单 */}
      <div className="flex-1 bg-zinc-950 border-l border-white/5 flex flex-col min-h-0 animate-in slide-in-from-right duration-700">
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/40">
           <div className="flex flex-col">
              <span className="text-[10px] font-black text-white uppercase tracking-widest italic">映画映射记录</span>
              <span className="text-[7px] text-zinc-600 font-bold uppercase mt-0.5">{videos.length} 映射点</span>
           </div>
           <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></div>
        </div>
        
        <div className="p-3">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700 text-[10px]"></i>
            <input 
              type="text" placeholder="查找映射记录..." 
              className="w-full bg-white/5 border border-white/5 rounded-lg py-2 pl-9 pr-4 text-[9px] focus:outline-none focus:border-red-600/50 transition-all text-white font-bold" 
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)} 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          {filteredVideos.map((v) => (
            <div 
              key={v.id} 
              onClick={() => handleVideoClick(v)} 
              className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all border ${activeVideo?.id === v.id ? 'bg-red-600/5 border-red-600/20' : 'hover:bg-white/[0.03] border-transparent'}`}
            >
              <div className="w-12 h-8 rounded-lg overflow-hidden bg-zinc-900 flex items-center justify-center border border-white/5 flex-shrink-0">
                {activeVideo?.id === v.id ? (
                  <div className="flex items-end space-x-0.5 h-1.5">
                     <div className="w-0.5 bg-red-600 animate-[bounce_0.6s_infinite]"></div>
                     <div className="w-0.5 bg-red-600 animate-[bounce_0.8s_infinite] delay-100"></div>
                  </div>
                ) : (
                  <i className="fa-solid fa-play text-zinc-800 text-[9px]"></i>
                )}
              </div>
              <div className="flex-1 truncate">
                <p className={`text-[10px] font-black truncate ${activeVideo?.id === v.id ? 'text-red-500' : 'text-zinc-400 group-hover:text-white'}`}>{v.name}</p>
                <p className="text-[7px] text-zinc-700 uppercase font-black tracking-tighter mt-0.5 italic">Mapping #Active</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoSection;
