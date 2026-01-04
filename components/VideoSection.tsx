
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
    setActiveTab('player');
  };

  const processUpload = async (files: File[] | FileList) => {
    if (files.length === 0) return;
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
      {/* Drag Overlay */}
      {isDragging && !shared && (
        <div className="absolute inset-0 z-[200] bg-red-600/20 backdrop-blur-sm border-4 border-dashed border-red-600 m-4 rounded-[2rem] flex flex-col items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-300">
           <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center shadow-2xl mb-6">
              <i className="fa-solid fa-cloud-arrow-up text-4xl text-white animate-bounce"></i>
           </div>
           <p className="text-2xl font-black text-white italic tracking-tighter">释放鼠标以上传精选视频</p>
           <p className="text-[10px] text-red-100 font-bold uppercase tracking-widest mt-2">支持多选，自动识别格式</p>
        </div>
      )}

      {/* Uploading Progress Overlay */}
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

      {/* 主展示区 */}
      <div className="flex-[2] bg-black relative flex items-center justify-center overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic">正在扫描云端资源...</p>
          </div>
        ) : activeTab === 'player' ? (
          activeVideo ? (
            <>
              <video 
                key={activeVideo.url}
                ref={videoRef}
                src={activeVideo.url} 
                className="w-full h-full object-contain"
                controls
                autoPlay
                playsInline
              />
              <div className="absolute bottom-10 left-6 right-6 pointer-events-none space-y-2 z-20">
                <h2 className="text-xl md:text-3xl font-black text-white drop-shadow-lg">{activeVideo.name}</h2>
                <div className="flex items-center space-x-3">
                   <span className="px-2 py-0.5 bg-red-600 text-[10px] font-black uppercase rounded text-white">精选</span>
                   <p className="text-sm text-zinc-300 font-bold uppercase tracking-widest shadow-black drop-shadow-md">Nocturne Selection</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
            </>
          ) : (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-zinc-900/50 rounded-full flex items-center justify-center mx-auto border border-white/5">
                <i className="fa-solid fa-clapperboard text-3xl text-zinc-700"></i>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-zinc-500 font-bold tracking-widest uppercase">暂无播放中的视频</p>
                  <p className="text-[10px] text-zinc-700 uppercase">目录: {S3_CONFIG.videoFolderPrefix}</p>
                </div>
                <button 
                  onClick={loadVideos}
                  className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase hover:bg-white/10 transition-all"
                >
                  <i className="fa-solid fa-arrows-rotate mr-2"></i> 重新扫描
                </button>
              </div>
            </div>
          )
        ) : (
          /* 管理模式 */
          <div className="w-full h-full p-8 md:p-12 overflow-y-auto bg-[#050505]">
             <div className="max-w-5xl mx-auto space-y-8">
               <div className="flex items-center justify-between border-b border-white/5 pb-6">
                  <div className="flex flex-col">
                    <h3 className="text-3xl font-black italic tracking-tighter">视频仓库 (Vault)</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="w-2 h-2 rounded-full bg-red-600"></span>
                      <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Bucket: {S3_CONFIG.bucketName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button onClick={loadVideos} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
                      <i className={`fa-solid fa-arrows-rotate ${loading ? 'animate-spin' : ''}`}></i>
                    </button>
                    {!shared && (
                      <label className="cursor-pointer bg-red-600 text-white px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20 active:scale-95 transition-all flex items-center space-x-2">
                         <i className="fa-solid fa-cloud-arrow-up"></i>
                         <span>上传新视频</span>
                         <input type="file" className="hidden" onChange={e => handleFileUpload(e.target.files)} accept="video/*" multiple />
                      </label>
                    )}
                  </div>
               </div>

               {filteredVideos.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {filteredVideos.map(v => (
                     <div key={v.id} className="bg-white/[0.03] border border-white/5 rounded-3xl overflow-hidden group hover:bg-white/[0.06] transition-all flex flex-col">
                       <div className="aspect-video relative overflow-hidden bg-zinc-900 flex items-center justify-center">
                          <i className="fa-solid fa-file-video text-3xl text-zinc-800 transition-transform duration-700 group-hover:scale-125"></i>
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => handleVideoClick(v)} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black shadow-xl">
                                <i className="fa-solid fa-play ml-1"></i>
                             </button>
                          </div>
                       </div>
                       <div className="p-5 flex items-center justify-between">
                         <div className="truncate flex-1 mr-4">
                            <p className="text-sm font-black text-white truncate">{v.name}</p>
                            <p className="text-[10px] text-zinc-600 uppercase font-bold mt-1">
                              {new Date(v.lastModified || '').toLocaleDateString()}
                            </p>
                         </div>
                         {!shared && (
                           <div className="flex items-center space-x-1">
                              <button onClick={(e) => handleRenameVideo(e, v)} className="p-2.5 text-zinc-600 hover:text-white transition-colors"><i className="fa-solid fa-pen-nib text-xs"></i></button>
                              <button onClick={(e) => handleDeleteVideo(e, v)} className="p-2.5 text-zinc-600 hover:text-red-600 transition-colors"><i className="fa-solid fa-trash-can text-xs"></i></button>
                           </div>
                         )}
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="h-64 flex flex-col items-center justify-center text-zinc-800 space-y-4">
                   <i className="fa-solid fa-video-slash text-5xl opacity-20"></i>
                   <p className="text-sm font-bold tracking-widest uppercase">该目录下暂无视频文件</p>
                 </div>
               )}
             </div>
          </div>
        )}
      </div>

      {/* 右侧列表区 */}
      <div className="flex-1 bg-zinc-950/50 backdrop-blur-3xl border-l border-white/5 flex flex-col md:w-80 relative z-[10]">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40">
           <div className="flex items-center space-x-3">
             <button onClick={() => setActiveTab('player')} className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-all ${activeTab === 'player' ? 'bg-red-600 text-white' : 'text-zinc-500'}`}>播放器</button>
             <button onClick={() => setActiveTab('manage')} className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-all ${activeTab === 'manage' ? 'bg-red-600 text-white' : 'text-zinc-500'}`}>管理</button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
           <div className="relative mb-4">
             <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700 text-[10px]"></i>
             <input 
               type="text" 
               placeholder="快速搜索..." 
               className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-8 pr-4 text-[10px] focus:outline-none focus:border-red-600 transition-all text-white"
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
             />
           </div>

           {videos.length === 0 && !loading && (
             <p className="text-center py-10 text-[10px] text-zinc-600 uppercase italic font-bold">空空如也</p>
           )}

           {videos.map((v, i) => (
             <div 
               key={v.id} 
               onClick={() => handleVideoClick(v)}
               className={`group flex items-center space-x-3 p-3 rounded-2xl cursor-pointer transition-all ${activeVideo?.id === v.id ? 'bg-red-600/10 border border-red-600/20' : 'hover:bg-white/5 border border-transparent'}`}
             >
               <div className="w-12 h-8 rounded-lg overflow-hidden relative flex-shrink-0 bg-zinc-900 flex items-center justify-center">
                  <i className={`fa-solid fa-play text-[10px] ${activeVideo?.id === v.id ? 'text-red-500 animate-pulse' : 'text-zinc-800'}`}></i>
               </div>
               <div className="flex-1 truncate">
                  <p className={`text-[11px] font-bold truncate ${activeVideo?.id === v.id ? 'text-red-500' : 'text-zinc-300'}`}>{v.name}</p>
                  <p className="text-[9px] text-zinc-600 uppercase font-black tracking-tighter mt-0.5">Selection #{i + 1}</p>
               </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default VideoSection;
