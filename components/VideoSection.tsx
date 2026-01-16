
import React, { useState, useEffect, useRef } from 'react';
import { Video, NotificationType } from '../types';
import { fetchVideos } from '../services/s3Service';

interface VideoSectionProps {
  externalActiveVideo?: Video | null;
  onNotify?: (message: string, type: NotificationType) => void;
}

const VideoSection: React.FC<VideoSectionProps> = ({ externalActiveVideo, onNotify }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchVideos().then(v => {
      setVideos(v);
      if (externalActiveVideo) {
        setActiveVideo(externalActiveVideo);
      } else if (v.length > 0) {
        setActiveVideo(v[0]);
      }
    });
  }, [externalActiveVideo]);

  // 当外部选中的视频变化时，同步内部状态
  useEffect(() => {
    if (externalActiveVideo) {
        setActiveVideo(externalActiveVideo);
    }
  }, [externalActiveVideo]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
        videoRef.current.pause();
    } else {
        videoRef.current.play().catch(() => {
            onNotify?.('播放请求被阻止，请点击屏幕交互后再试', 'warning');
        });
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const p = (videoRef.current.currentTime / (videoRef.current.duration || 1)) * 100;
    setProgress(p);
  };

  const handleVideoSelect = (v: Video) => {
    setActiveVideo(v);
    setIsLoading(true);
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-black overflow-hidden relative">
      <div className="flex-[3] relative bg-black flex items-center justify-center min-h-0">
        {activeVideo ? (
          <div className="w-full h-full relative group flex items-center justify-center">
            {isLoading && (
               <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                  <i className="fa-solid fa-spinner animate-spin text-4xl text-[#C20C0C] mb-4"></i>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">物理信号建立中...</p>
               </div>
            )}
            
            <video 
              ref={videoRef} 
              key={activeVideo.url} 
              src={activeVideo.url} 
              className="w-full h-full max-h-full object-contain" 
              autoPlay 
              playsInline
              crossOrigin="anonymous"
              onPlay={() => { setIsPlaying(true); setIsLoading(false); }} 
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
              onWaiting={() => setIsLoading(true)}
              onCanPlay={() => setIsLoading(false)}
              onError={() => {
                onNotify?.('视频波段丢失，请检查源文件权限', 'error');
                setIsLoading(false);
              }}
            />

            {/* 自定义控制层 */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-between p-8 pointer-events-none">
              <div className="flex items-center justify-between pointer-events-auto">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black italic tracking-tighter drop-shadow-2xl">{activeVideo.name}</h2>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black bg-[#C20C0C] px-2 py-0.5 rounded uppercase tracking-widest">MLOG</span>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest italic">Node: {activeVideo.id.slice(0, 8)}</p>
                  </div>
                </div>
                <button className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-3xl flex items-center justify-center border border-white/10 hover:bg-[#C20C0C] transition-all"><i className="fa-solid fa-share-nodes text-xs"></i></button>
              </div>

              <div className="flex items-center gap-6 pointer-events-auto">
                <button onClick={togglePlay} className="text-3xl w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                  <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play ml-1'}`}></i>
                </button>
                <div className="flex-1 space-y-2">
                    <div className="h-1 bg-white/10 rounded-full relative group cursor-pointer">
                        <div className="absolute left-0 top-0 h-full bg-[#C20C0C] rounded-full transition-all duration-300 shadow-[0_0_10px_#C20C0C]" style={{ width: `${progress}%` }}></div>
                        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `${progress}%` }}></div>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Synchronized Stream</span>
                        <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">1080P · High Res</span>
                    </div>
                </div>
              </div>
            </div>
            
            {/* 未播放时的中心按钮 */}
            {!isPlaying && !isLoading && (
                <button 
                  onClick={togglePlay}
                  className="absolute z-20 w-24 h-24 bg-[#C20C0C] rounded-full flex items-center justify-center text-4xl shadow-[0_0_50px_rgba(194,12,12,0.5)] hover:scale-110 transition-all active:scale-90"
                >
                    <i className="fa-solid fa-play ml-2"></i>
                </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center opacity-10 space-y-4">
            <i className="fa-solid fa-circle-play text-8xl animate-pulse"></i>
            <p className="text-xs font-black uppercase tracking-[0.5em]">暂无映画信号记录</p>
          </div>
        )}
      </div>

      {/* 侧边列表 */}
      <div className="flex-1 border-l border-white/5 bg-[#080808] flex flex-col min-w-[320px] lg:max-w-[400px]">
        <div className="p-8 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <h3 className="text-sm font-black italic tracking-widest uppercase">精选影集</h3>
          </div>
          <span className="text-[10px] text-white/20 uppercase font-black tracking-widest">{videos.length} 记录</span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 pb-24">
          {videos.map(v => (
            <div 
              key={v.id} onClick={() => handleVideoSelect(v)}
              className={`flex gap-4 p-4 rounded-3xl transition-all cursor-pointer border ${activeVideo?.id === v.id ? 'bg-[#C20C0C]/10 border-[#C20C0C]/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)]' : 'hover:bg-white/5 border-transparent'}`}
            >
              <div className="w-32 aspect-video rounded-2xl overflow-hidden relative flex-shrink-0 bg-zinc-900 border border-white/5">
                <img src={v.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                {activeVideo?.id === v.id && (
                    <div className="absolute inset-0 bg-[#C20C0C]/40 flex items-center justify-center backdrop-blur-[2px]">
                        <i className="fa-solid fa-play text-sm text-white"></i>
                    </div>
                )}
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded text-[8px] font-black">V-SYNC</div>
              </div>
              <div className="flex-1 truncate py-1 space-y-2">
                <p className={`text-xs font-black truncate leading-tight ${activeVideo?.id === v.id ? 'text-[#C20C0C]' : 'text-white/80'}`}>{v.name}</p>
                <div className="flex items-center gap-2">
                   <p className="text-[9px] text-white/20 uppercase font-bold tracking-widest italic truncate">CloudVideo Node</p>
                </div>
              </div>
            </div>
          ))}
          {videos.length === 0 && (
              <div className="py-20 text-center space-y-4 opacity-5">
                  <i className="fa-solid fa-video-slash text-4xl"></i>
                  <p className="text-[10px] font-black uppercase tracking-widest">等待信号载入</p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoSection;
