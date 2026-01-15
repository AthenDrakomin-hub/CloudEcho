
import React, { useState, useEffect, useRef } from 'react';
import { Video, NotificationType } from '../types';
import { fetchVideos } from '../services/s3Service';

interface VideoSectionProps {
  onNotify?: (message: string, type: NotificationType) => void;
}

const VideoSection: React.FC<VideoSectionProps> = ({ onNotify }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchVideos().then(v => {
      setVideos(v);
      if (v.length > 0) setActiveVideo(v[0]);
    });
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(p);
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-black overflow-hidden relative">
      <div className="flex-[3] relative bg-black flex items-center justify-center min-h-0">
        {activeVideo ? (
          <div className="w-full h-full relative group">
            <video 
              ref={videoRef} key={activeVideo.url} src={activeVideo.url} 
              className="w-full h-full object-contain" autoPlay
              onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-between p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl font-black italic">{activeVideo.name}</h2>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Featured Mlog</p>
                </div>
                <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-3xl flex items-center justify-center border border-white/10"><i className="fa-solid fa-share-nodes text-xs"></i></button>
              </div>
              <div className="flex items-center gap-6">
                <button onClick={togglePlay} className="text-2xl w-10 h-10 flex items-center justify-center"><i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i></button>
                <div className="flex-1 h-1 bg-white/10 rounded-full relative overflow-hidden">
                  <div className="absolute left-0 top-0 h-full bg-[#C20C0C] rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center opacity-10 space-y-4">
            <i className="fa-solid fa-circle-play text-6xl"></i>
            <p className="text-xs font-black uppercase tracking-widest">暂无映画记录</p>
          </div>
        )}
      </div>

      <div className="flex-1 border-l border-white/5 bg-[#121212] flex flex-col min-w-[320px]">
        <div className="p-8 flex items-center justify-between border-b border-white/5">
          <h3 className="text-sm font-black italic">精选推荐</h3>
          <span className="text-[10px] text-white/20 uppercase font-black">{videos.length} 记录</span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          {videos.map(v => (
            <div 
              key={v.id} onClick={() => setActiveVideo(v)}
              className={`flex gap-4 p-3 rounded-2xl transition-all cursor-pointer ${activeVideo?.id === v.id ? 'bg-[#C20C0C]/10 border border-[#C20C0C]/20' : 'hover:bg-white/5'}`}
            >
              <div className="w-24 aspect-video rounded-lg overflow-hidden relative flex-shrink-0 bg-zinc-800">
                <img src={v.coverUrl} className="w-full h-full object-cover" alt="" />
                {activeVideo?.id === v.id && <div className="absolute inset-0 bg-[#C20C0C]/40 flex items-center justify-center"><i className="fa-solid fa-play text-[10px]"></i></div>}
              </div>
              <div className="flex-1 truncate py-1">
                <p className={`text-[11px] font-black truncate ${activeVideo?.id === v.id ? 'text-[#C20C0C]' : 'text-white/80'}`}>{v.name}</p>
                <p className="text-[9px] text-white/20 mt-1 uppercase font-bold tracking-widest italic">Signal V-Mapping</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoSection;
