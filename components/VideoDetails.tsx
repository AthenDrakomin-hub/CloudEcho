
import React, { useState } from 'react';
import { Video } from '../types';
import { renameFile, downloadVideo } from '../services/s3Service';
import { S3_CONFIG } from '../constants';

interface VideoDetailsProps {
  video: Video;
  onBack: () => void;
  onUpdate: (video: Video) => void;
}

const VideoDetails: React.FC<VideoDetailsProps> = ({ video, onBack, onUpdate }) => {
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [tempName, setTempName] = useState(video.name);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleSaveMetadata = async () => {
    if (!tempName.trim()) {
      alert('请填写视频名称');
      return;
    }

    setIsSaving(true);
    try {
      const ext = video.url.split('.').pop() || 'mp4';
      const success = await renameFile(video.url, `${tempName.trim()}.${ext}`, S3_CONFIG.videoFolderPrefix);
      if (success) {
        onUpdate({ ...video, name: tempName.trim() });
        setIsEditingMetadata(false);
        onBack();
      }
    } catch (err: any) {
      console.error("Rename Video Error:", err);
      alert(`重命名失败: ${err.message || '未知错误'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    await downloadVideo(video);
    setIsDownloading(false);
  };

  return (
    <div className="h-full flex flex-col p-6 md:p-10 overflow-y-auto relative bg-zinc-950/40">
      <div 
        className="absolute inset-0 -z-10 opacity-20 blur-[120px] scale-110 pointer-events-none"
        style={{ backgroundImage: `url(${video.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      ></div>

      <div className="max-w-6xl mx-auto w-full space-y-10 pb-20">
        <nav className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-all group py-2">
            <i className="fa-solid fa-chevron-left text-sm transition-transform group-hover:-translate-x-1"></i>
            <span className="font-medium">返回放映厅列表</span>
          </button>
          
          <button 
            onClick={handleDownload} 
            disabled={isDownloading}
            className="flex items-center space-x-3 px-6 py-2.5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl active:scale-95"
          >
            {isDownloading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-download"></i>}
            <span>{isDownloading ? '正在准备下载...' : '下载此影片'}</span>
          </button>
        </nav>

        <section className="flex flex-col items-center md:items-start gap-8 md:gap-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-full aspect-video rounded-[3rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.7)] border border-white/10 bg-black relative group">
            <video 
              src={video.url} 
              className="w-full h-full object-contain" 
              controls 
              playsInline
            />
          </div>
          
          <div className="w-full flex flex-col md:flex-row items-center md:items-end justify-between gap-8">
            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <span className="px-2.5 py-1 rounded-md bg-red-600/20 text-red-500 text-[10px] font-black uppercase tracking-tighter border border-red-600/20"># 精选影片</span>
                {video.lastModified && (
                  <span className="px-2.5 py-1 rounded-md bg-white/5 text-zinc-500 text-[10px] font-black uppercase tracking-tighter border border-white/5">
                    Added: {new Date(video.lastModified).toLocaleDateString()}
                  </span>
                )}
              </div>

              {isEditingMetadata ? (
                <div className="space-y-4 max-w-lg">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">视频标题</label>
                    <input 
                      value={tempName} 
                      onChange={(e) => setTempName(e.target.value)} 
                      className="w-full bg-zinc-900/80 border border-white/10 rounded-2xl px-5 py-3 text-2xl font-bold text-white focus:outline-none focus:border-red-600 transition-all" 
                    />
                  </div>
                  <div className="flex items-center space-x-3 pt-2">
                    <button 
                      onClick={handleSaveMetadata} 
                      disabled={isSaving} 
                      className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-500 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-red-600/20"
                    >
                      {isSaving ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-check"></i>}
                      <span>确认修改</span>
                    </button>
                    <button onClick={() => setIsEditingMetadata(false)} className="px-6 py-3 bg-white/5 text-zinc-400 rounded-2xl font-medium">取消</button>
                  </div>
                </div>
              ) : (
                <div className="group relative pr-12 inline-block w-full">
                  <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-tight italic">{video.name}</h1>
                  <p className="text-sm text-zinc-500 font-bold uppercase tracking-[0.2em] mt-2">Resource Mapping: jingxuanshipin</p>
                  <button 
                    onClick={() => setIsEditingMetadata(true)} 
                    className="absolute top-2 right-0 w-12 h-12 rounded-2xl bg-white/5 border border-white/5 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-zinc-400 hover:text-red-500 shadow-xl"
                  >
                    <i className="fa-solid fa-pen-nib text-sm"></i>
                  </button>
                </div>
              )}
            </div>

            <div className="flex-shrink-0 flex items-center space-x-4">
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] text-center min-w-[120px]">
                 <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Status</p>
                 <div className="flex items-center justify-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-black text-white uppercase italic">Active</span>
                 </div>
              </div>
            </div>
          </div>
        </section>

        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
           <div className="bg-zinc-900/80 backdrop-blur-2xl rounded-[3rem] p-10 border border-white/5 space-y-8">
              <div className="flex items-center space-x-4 border-b border-white/5 pb-6">
                 <i className="fa-solid fa-circle-nodes text-red-600 text-xl"></i>
                 <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">映射详情 (Storage Context)</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-zinc-400">
                 <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-white/5">
                       <span className="text-[10px] font-black uppercase tracking-widest">Bucket</span>
                       <span className="text-xs font-mono text-zinc-200">{S3_CONFIG.bucketName}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-white/5">
                       <span className="text-[10px] font-black uppercase tracking-widest">Folder</span>
                       <span className="text-xs font-mono text-zinc-200">{S3_CONFIG.videoFolderPrefix}</span>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-white/5">
                       <span className="text-[10px] font-black uppercase tracking-widest">Endpoint</span>
                       <span className="text-xs font-mono text-zinc-200 truncate ml-4 max-w-[200px]">{S3_CONFIG.endpoint}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-white/5">
                       <span className="text-[10px] font-black uppercase tracking-widest">Format</span>
                       <span className="text-xs font-mono text-zinc-200 uppercase">Video/MP4</span>
                    </div>
                 </div>
              </div>
              
              <div className="p-8 bg-red-600/5 border border-red-600/10 rounded-3xl">
                 <p className="text-[11px] text-zinc-500 font-bold leading-relaxed italic text-center">
                   “在这个数字化的放映厅里，每一帧画面都是记忆的碎片。在这里，时间可以被倒带，也可以被永久封存。”
                 </p>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};

export default VideoDetails;
