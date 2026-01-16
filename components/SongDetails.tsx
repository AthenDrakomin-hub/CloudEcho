
import React, { useState } from 'react';
import { Song, NotificationType } from '../types';
import { renameSongV3 } from '../services/s3Service';
import { localTranslate } from '../services/translationService';
import Collapse from './Collapse';

interface SongDetailsProps {
  song: Song;
  onBack: () => void;
  onUpdate: (song: Song) => void;
  onNotify: (message: string, type: NotificationType) => void;
}

const SongDetails: React.FC<SongDetailsProps> = ({ song, onBack, onUpdate, onNotify }) => {
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [isEditingLyrics, setIsEditingLyrics] = useState(false);
  const [editedLyrics, setEditedLyrics] = useState(song.lyrics || '');
  
  const [tempArtist, setTempArtist] = useState(song.artist);
  const [tempTitle, setTempTitle] = useState(song.name);
  const [tempTags, setTempTags] = useState(song.tags?.join(' ') || '');
  const [isSaving, setIsSaving] = useState(false);

  const QUICK_TAGS = ['#DJ', '#民谣', '#江湖', '#金融播客', '#emo', '#子夜回响'];

  const handleLocalCorrection = () => {
    setTempTitle(localTranslate(tempTitle));
    setTempArtist(localTranslate(tempArtist));
    onNotify('已根据本地词库校准文本', 'info');
  };

  const handleSaveMetadata = async () => {
    if (!tempTitle.trim()) {
        onNotify('标题为必填项', 'warning');
        return;
    }
    setIsSaving(true);
    const tagsArray = tempTags.split(/\s+/).filter(t => t).map(t => t.startsWith('#') ? t : '#' + t);
    try {
      const success = await renameSongV3(song.url, tempArtist, tempTitle, tagsArray);
      if (!success) throw new Error("Cloud Storage Mapping Failed");
      onNotify('V3 物理映射重命名成功', 'success');
      onBack();
      onUpdate(song);
    } catch (err: any) {
      onNotify(`同步失败: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-8 md:p-16 overflow-y-auto custom-scrollbar bg-transparent">
      <div className="max-w-5xl mx-auto w-full space-y-16 pb-20">
        <nav>
          <button onClick={onBack} className="flex items-center space-x-4 text-white/30 hover:text-white transition-all font-black uppercase tracking-widest text-[10px]">
            <i className="fa-solid fa-arrow-left"></i>
            <span>返回清单</span>
          </button>
        </nav>

        <section className="flex flex-col md:flex-row items-center gap-16">
          <div className="w-64 h-64 md:w-96 md:h-96 rounded-[4rem] overflow-hidden shadow-2xl relative group border border-white/10 ring-1 ring-white/5 bg-zinc-900">
            <img src={song.coverUrl} className="w-full h-full object-cover" alt="Cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
               <span className="text-white text-[9px] font-black uppercase tracking-[0.4em] border border-white/20 px-6 py-3 rounded-full">V3 安全节点</span>
            </div>
          </div>
          
          <div className="flex-1 space-y-8 w-full">
            {isEditingMetadata ? (
              <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 space-y-8 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                  <h3 className="font-black italic text-white text-sm uppercase tracking-widest">物理层更名 (V3 Safe Mapping)</h3>
                  <button onClick={handleLocalCorrection} className="px-5 py-2.5 bg-white/10 text-white/60 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-white transition-all">
                    <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>校准词库
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">中文标题</p>
                    <input value={tempTitle} onChange={e => setTempTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-black text-white outline-none focus:border-[#C20C0C]/50" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">中文歌手</p>
                    <input value={tempArtist} onChange={e => setTempArtist(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-black text-white outline-none focus:border-[#C20C0C]/50" />
                  </div>
                </div>
                
                <div className="space-y-4">
                   <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">标签 (#DJ #伤感)</p>
                   <input value={tempTags} onChange={e => setTempTags(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-black text-[#C20C0C] outline-none focus:border-[#C20C0C]/50" />
                   <div className="flex flex-wrap gap-2">
                      {QUICK_TAGS.map(tag => (
                        <button key={tag} onClick={() => setTempTags(prev => prev.includes(tag) ? prev : prev + ' ' + tag)} className="px-3 py-1 rounded-lg text-[9px] font-black bg-white/5 border border-white/10 text-white/30 hover:text-white">{tag}</button>
                      ))}
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={handleSaveMetadata} disabled={isSaving} className="flex-1 py-5 bg-[#C20C0C] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:brightness-110 shadow-xl active:scale-95">
                    {isSaving ? '正在物理更名...' : '提交 V3 安全映射'}
                  </button>
                  <button onClick={() => setIsEditingMetadata(false)} className="px-8 py-5 border border-white/10 text-white/40 rounded-2xl font-black text-[11px] uppercase hover:text-white">取消</button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex flex-wrap gap-3">
                  {song.tags?.map(t => (
                    <span key={t} className="px-4 py-1.5 bg-[#C20C0C]/10 text-[#C20C0C] border border-[#C20C0C]/20 rounded-full text-[9px] font-black uppercase tracking-widest">{t}</span>
                  ))}
                </div>
                <h1 className="text-4xl md:text-8xl font-black text-white tracking-tighter leading-none italic aurora-text">{song.name}</h1>
                <p className="text-xl md:text-3xl font-black text-white/20 tracking-widest uppercase italic">{song.artist}</p>
                <button onClick={() => setIsEditingMetadata(true)} className="px-8 py-4 bg-white/5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10">
                    <i className="fa-solid fa-pen-nib text-[#C20C0C] mr-4"></i>修正映射名称
                </button>
              </div>
            )}
          </div>
        </section>

        <Collapse title="共鸣文字映射" icon="fa-quote-left" accentColor="red" defaultOpen={true}>
          <div className="pt-8">
            {isEditingLyrics ? (
              <textarea value={editedLyrics} onChange={(e) => setEditedLyrics(e.target.value)} className="w-full h-80 bg-white/5 border border-white/10 rounded-[2rem] p-10 text-2xl font-black italic text-white outline-none focus:border-[#C20C0C]/30" />
            ) : (
              <div className="min-h-[200px] flex items-center justify-center text-center">
                <p className="text-2xl md:text-5xl font-black text-white italic tracking-tighter leading-relaxed opacity-90 font-serif-quote">
                  {editedLyrics || "“这辈子得到了很多空头支票，你的永远也是其中一张。”"}
                </p>
              </div>
            )}
            <div className="flex justify-end mt-10">
              <button onClick={() => setIsEditingLyrics(!isEditingLyrics)} className="text-[10px] font-black text-[#C20C0C] uppercase tracking-widest border-b border-[#C20C0C]/30 hover:text-white transition-colors">
                {isEditingLyrics ? '保存感悟' : '修正文字轨迹'}
              </button>
            </div>
          </div>
        </Collapse>
      </div>
    </div>
  );
};

export default SongDetails;
