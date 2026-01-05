
import React, { useState, useEffect, useRef } from 'react';
import { Video } from '../types';
import { fetchVideos, uploadFile, deleteFile, renameFile } from '../services/s3Service';
import { S3_CONFIG } from '../constants';

interface VideoSectionProps {
  onPlaySong?: (song: any) => void;
  shared?: boolean;
}

const VideoSection: React.FC<VideoSectionProps> = ({ onPlaySong, shared = false }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'player' | 'manage'>('player');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadingFile, setCurrentUploadingFile] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const fetched = await fetchVideos();
      setVideos(fetched);
      if (fetched.length > 0 && !activeVideo) {
        setActiveVideo(fetched[0]);
      } else if (fetched.length === 0) {
        setActiveVideo(null);
      }
    } catch (e) {
      console.error("Failed to fetch videos:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const handleVideoClick = (video: Video) => {
    setActiveVideo(video);
    // 在所有者模式下，点击自动切回播放器视图；在共享模式下，视图本来就是 player
    if (!shared) {
       setActiveTab('player');
    }
  };

  const processUpload = async (files: File[] | FileList) => {
    if (shared || files.length === 0) return;
    setIsUploading(true);
    setUploadProgress(0);
    
    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        const isVideo = file.type.startsWith('video/') || 
                        ['.mp4', '.mov', '.webm', '.mkv'].some(ext => file.name.toLowerCase().endsWith(ext));
        
        if (!isVideo) {
          console.warn(`跳过非视频文件: ${file.name}`);
          continue;
        }

        setCurrentUploadingFile(`${file.name} (${i + 1}/${files.length})`);
        setUploadProgress(Math.round((i / files.length) * 100));
        
        const success = await uploadFile(file, file.name, S3_CONFIG.videoFolderPrefix);
        if (!success) throw new Error("Upload service returned false");
        
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      } catch (e) {
        console.error("上传失败:", files[i].name, e);
        alert(`文件 ${files[i].name} 上传失败，请检查网络或权限。`);
      }
    }
    
    await loadVideos();
    setIsUploading(false);
    setUploadProgress(0);
    setCurrentUploadingFile(null);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (files) processUpload(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!shared) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (shared) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUpload(e.dataTransfer.files);
    }
  };

  const handleDeleteVideo = async (e: React.MouseEvent, video: Video) => {
    e.stopPropagation();
    if (shared) return;
    if (!confirm(`确定永久删除视频 "${video.name}" 吗？`)) return;
    
    const urlParts = video.url.split('/');
    const bucketIndex = urlParts.indexOf(S3_CONFIG.bucketName);
    const key = decodeURIComponent(urlParts.slice(bucketIndex + 1).join('/'));
    
    const success = await deleteFile(key);
    if (success) {
      if (activeVideo?.id === video.id) setActiveVideo(null);
      await loadVideos();
    }
  };

  const handleRenameVideo = async (e: React.MouseEvent, video: Video) => {
    e.stopPropagation();
    if (shared) return;
    const newName = prompt("重命名视频文件 (不含扩展名):", video.name);
    if (!newName || newName.trim() === video.name) return;

    try {
      const ext = video.url.split('.').pop() || 'mp4';
      const success = await renameFile(video.url, `${newName.trim()}.${ext}`, S3_CONFIG.videoFolderPrefix);
      if (success) await loadVideos();
    } catch (err) {
      alert("重命名失败，请重试");
    }
  };

  const filteredVideos = videos.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-[#020202] relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 拖拽上传浮层 (仅所有者可见) */}
      {isDragging && !shared && (
        <div className="absolute inset-0 z-[200] bg-red-600/20 backdrop-blur-sm border-4 border-dashed border-red-600 m-4 rounded-[2rem] flex flex-col items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-300">
           <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center shadow-2xl mb-6">
              <i className="fa-solid fa-cloud-arrow-up text-4xl text-white animate-bounce"></i>
           </div>
           <p className="text-2xl font-black text-white italic tracking-tighter">释放鼠标以上传精选视频</p>
           <p className="text-[10px] text-red-100 font-bold uppercase tracking-widest mt-2">支持多选，自动识别格式</p>
        </div>
      )}

      {/* 上传进度 (仅所有者可见) */}
      {isUploading && (
        <div className="absolute inset-0 z-[150] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
          <div className="max-w-md w-full space-y-8 text-center">
             <div className="relative inline-block">
               <div className="w-32 h-32 rounded-full border-4 border-zinc-900 flex items-center justify-center relative">
                  <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                    <circle 
                      cx="50" cy="50" r="46" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="4" 
                      className="text-red-600 transition-all duration-500 ease-out"
                      strokeDasharray="289.02"
                      strokeDashoffset={289.02 - (289.02 * uploadProgress) / 100}
                    />
                  </svg>
                  <span className="text-2xl font-black italic">{uploadProgress}%</span>
               </div>
               <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <i className="fa-solid fa-arrow-up-from-bracket text-white text-xs"></i>
               </div>
             </div>
             <div className="space-y-2">
                <h3 className="text-xl font-black italic tracking-tighter uppercase">同步视频库中...</h3>
                <p className="text-[11px] text-zinc-400 font-bold truncate px-4">
                  {currentUploadingFile || "正在准备文件..."}
                </p>
             </div>
             <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden shadow-inner border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_15px_rgba(194,12,12,0.5)] transition-all duration-500 ease-out" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
             </div>
          </div>
        </div>
      )}

      {/* 主展示区 - 视频播放器 */}
      <div className="flex-[2.5] bg-black relative flex items-center justify-center overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic">正在扫描云端资源...</p>
          </div>
        ) : (activeTab === 'player' || shared) ? (
          activeVideo ? (
            <div className="w-full h-full relative group">
              <video 
                key={activeVideo.url}
                ref={videoRef}
                src={activeVideo.url} 
                className="w-full h-full object-contain"
                controls
                autoPlay
                playsInline
              />
              <div className="absolute bottom-12 left-8 right-8 pointer-events-none space-y-2 z-20 transition-opacity duration-500 group-hover:opacity-100 opacity-80">
                <h2 className="text-2xl md:text-4xl font-black text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] italic tracking-tighter">
                   {activeVideo.name}
                </h2>
                <div className="flex items-center space-x-3">
                   <span className="px-2 py-0.5 bg-red-600 text-[10px] font-black uppercase rounded text-white shadow-lg">正在放映</span>
                   <p className="text-xs text-zinc-300 font-bold uppercase tracking-widest shadow-black drop-shadow-md">Nocturne Midnight Screening</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          ) : (
            <div className="text-center space-y-6 animate-in fade-in duration-1000">
              <div className="w-24 h-24 bg-zinc-900/50 rounded-full flex items-center justify-center mx-auto border border-white/5 shadow-inner">
                <i className="fa-solid fa-clapperboard text-4xl text-zinc-800"></i>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-zinc-500 font-bold tracking-widest uppercase italic">暂无播放中的视频</p>
                  {!shared && <p className="text-[10px] text-zinc-700 uppercase">目录: {S3_CONFIG.videoFolderPrefix}</p>}
                </div>
                {!shared && (
                  <button 
                    onClick={loadVideos}
                    className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
                  >
                    <i className="fa-solid fa-arrows-rotate mr-2"></i> 重新扫描
                  </button>
                )}
              </div>
            </div>
          )
        ) : (
          /* 管理模式 (仅所有者可见) */
          <div className="w-full h-full p-8 md:p-12 overflow-y-auto bg-[#050505] custom-scrollbar">
             <div className="max-w-5xl mx-auto space-y-10">
               <div className="flex items-center justify-between border-b border-white/5 pb-8">
                  <div className="flex flex-col">
                    <h3 className="text-4xl font-black italic tracking-tighter">视频仓库 (Vault)</h3>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                      <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Storage: {S3_CONFIG.bucketName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button onClick={loadVideos} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-white/5">
                      <i className={`fa-solid fa-arrows-rotate ${loading ? 'animate-spin' : ''}`}></i>
                    </button>
                    <label className="cursor-pointer bg-red-600 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-red-600/20 active:scale-95 transition-all flex items-center space-x-2">
                       <i className="fa-solid fa-cloud-arrow-up"></i>
                       <span>上传新片</span>
                       <input type="file" className="hidden" onChange={e => handleFileUpload(e.target.files)} accept="video/*" multiple />
                    </label>
                  </div>
               </div>

               {filteredVideos.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {filteredVideos.map(v => (
                     <div key={v.id} className="bg-white/[0.03] border border-white/5 rounded-[2rem] overflow-hidden group hover:bg-white/[0.06] transition-all flex flex-col hover:border-red-600/30">
                       <div className="aspect-video relative overflow-hidden bg-zinc-900 flex items-center justify-center">
                          <i className="fa-solid fa-file-video text-4xl text-zinc-800 transition-transform duration-700 group-hover:scale-125"></i>
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => handleVideoClick(v)} className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-black shadow-2xl active:scale-90 transition-transform">
                                <i className="fa-solid fa-play ml-1"></i>
                             </button>
                          </div>
                       </div>
                       <div className="p-6 flex items-center justify-between">
                         <div className="truncate flex-1 mr-4">
                            <p className="text-sm font-black text-white truncate group-hover:text-red-500 transition-colors">{v.name}</p>
                            <p className="text-[10px] text-zinc-600 uppercase font-bold mt-1">
                              Added: {new Date(v.lastModified || '').toLocaleDateString()}
                            </p>
                         </div>
                         <div className="flex items-center space-x-1">
                            <button onClick={(e) => handleRenameVideo(e, v)} className="p-3 text-zinc-600 hover:text-white transition-colors"><i className="fa-solid fa-pen-nib text-xs"></i></button>
                            <button onClick={(e) => handleDeleteVideo(e, v)} className="p-3 text-zinc-600 hover:text-red-600 transition-colors"><i className="fa-solid fa-trash-can text-xs"></i></button>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="h-96 flex flex-col items-center justify-center text-zinc-800 space-y-6">
                   <i className="fa-solid fa-video-slash text-6xl opacity-10"></i>
                   <p className="text-sm font-bold tracking-widest uppercase italic">当前目录暂无影片资源</p>
                 </div>
               )}
             </div>
          </div>
        )}
      </div>

      {/* 右侧边栏 - 视频列表项 */}
      <div className="flex-1 bg-zinc-950/80 backdrop-blur-3xl border-l border-white/5 flex flex-col md:w-96 relative z-[10] shadow-2xl animate-in slide-in-from-right duration-500">
        {!shared ? (
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/40">
             <div className="flex items-center space-x-4 bg-white/5 p-1 rounded-2xl border border-white/5">
               <button 
                 onClick={() => setActiveTab('player')} 
                 className={`text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-xl transition-all ${activeTab === 'player' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 播放器
               </button>
               <button 
                 onClick={() => setActiveTab('manage')} 
                 className={`text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-xl transition-all ${activeTab === 'manage' ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 仓库管理
               </button>
             </div>
          </div>
        ) : (
          <div className="p-10 border-b border-white/5 flex flex-col items-center justify-center bg-black/40 space-y-2">
            <span className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic">深夜放映厅</span>
            <div className="flex items-center space-x-2">
               <div className="w-1 h-1 rounded-full bg-red-600 animate-pulse"></div>
               <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Now Streaming</span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
           <div className="relative mb-6">
             <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 text-[10px]"></i>
             <input 
               type="text" 
               placeholder="快速定位影片..." 
               className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-[10px] focus:outline-none focus:border-red-600 transition-all text-white font-bold"
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
             />
           </div>

           {videos.length === 0 && !loading && (
             <div className="flex flex-col items-center justify-center py-20 opacity-20 space-y-4">
               <i className="fa-solid fa-ghost text-4xl"></i>
               <p className="text-[10px] text-zinc-400 uppercase italic font-black tracking-widest">空无一物</p>
             </div>
           )}

           <div className="space-y-3">
             {filteredVideos.map((v, i) => (
               <div 
                 key={v.id} 
                 onClick={() => handleVideoClick(v)}
                 className={`group flex items-center space-x-4 p-4 rounded-[1.5rem] cursor-pointer transition-all border ${activeVideo?.id === v.id ? 'bg-red-600/10 border-red-600/30 ring-1 ring-red-600/20' : 'hover:bg-white/5 border-transparent'}`}
               >
                 <div className={`w-14 h-10 rounded-xl overflow-hidden relative flex-shrink-0 bg-zinc-900 flex items-center justify-center border transition-all ${activeVideo?.id === v.id ? 'border-red-600/50' : 'border-white/5'}`}>
                    {activeVideo?.id === v.id ? (
                      <div className="flex items-end space-x-0.5 h-3">
                        <div className="w-0.5 bg-red-600 animate-[bounce_0.6s_infinite]"></div>
                        <div className="w-0.5 bg-red-600 animate-[bounce_0.8s_infinite]"></div>
                        <div className="w-0.5 bg-red-600 animate-[bounce_0.5s_infinite]"></div>
                      </div>
                    ) : (
                      <i className="fa-solid fa-play text-[10px] text-zinc-800 group-hover:text-zinc-600 transition-colors"></i>
                    )}
                 </div>
                 <div className="flex-1 truncate">
                    <p className={`text-[11px] font-black truncate transition-colors ${activeVideo?.id === v.id ? 'text-red-500' : 'text-zinc-300 group-hover:text-white'}`}>{v.name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                       <p className="text-[9px] text-zinc-600 uppercase font-black tracking-tighter">Selection #{i + 1}</p>
                       {activeVideo?.id === v.id && (
                         <span className="text-[8px] text-red-600/60 font-black uppercase tracking-tighter animate-pulse">正在放映</span>
                       )}
                    </div>
                 </div>
               </div>
             ))}
           </div>
        </div>

        {shared && (
          <div className="p-8 border-t border-white/5 bg-black/20 text-center">
            <p className="text-[8px] text-zinc-700 uppercase font-black tracking-[0.3em]">Nocturne V-Space Mapping System</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoSection;
