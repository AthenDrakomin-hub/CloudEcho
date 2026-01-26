
import React, { useState } from 'react';
import { Song, NotificationType } from '../types';
import { renameSongV3 } from '../services/s3Service';
import { localTranslate, extractLocalTags } from '../services/translationService';
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
  const [isProcessing, setIsProcessing] = useState(false);

  // 快捷推荐标签
  const QUICK_TAGS = [
    '#DJ', '#民谣', '#江湖', '#金融播客', '#心灵鸡汤', 
    '#emo', '#人物志', '#子夜回响', '#每日财经', 
    '#皮一下挺好', '#未成年勿入'
  ];

  const toggleQuickTag = (tag: string) => {
    const currentTags = tempTags.split(/\s+/).filter(t => t);
    if (currentTags.includes(tag)) {
      setTempTags(currentTags.filter(t => t !== tag).join(' '));
    } else {
      setTempTags([...currentTags, tag].join(' '));
    }
  };

  const handleLocalCalibrate = () => {
    setIsProcessing(true);
    const calibratedTitle = localTranslate(tempTitle);
    const calibratedArtist = localTranslate(tempArtist);
    const autoTags = extractLocalTags(calibratedTitle, calibratedArtist);
    setTempTitle(calibratedTitle);
    setTempArtist(calibratedArtist);
    setTempTags(autoTags.join(' '));
    onNotify('本地词库校准完成', 'success');
    setIsProcessing(false);
  };

  const handleSaveMetadata = async () => {
    if (!tempTitle.trim()) {
        onNotify('歌曲标题不能为空', 'warning');
        return;
    }
    setIsSaving(true);
    const tagsArray = tempTags.split(/\s+/).filter(t => t).map(t => t.startsWith('#') ? t : '#' + t);
    try {
      const success = await renameSongV3(song.url, tempArtist, tempTitle, tagsArray);
      if (!success) throw new Error("Cloud Sync Failed");
      onNotify('V3 物理更名已生效', 'success');
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
          <div className="w-64 h-64 md:w-96 md:h-96 rounded-[4rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] relative group border border-white/10 ring-1 ring-white/5">
            <img src={song.coverUrl} className="w-full h-full object-cover" alt="Cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
               <span className="text-white text-[9px] font-black uppercase tracking-[0.4em] border border-white/20 px-6 py-3 rounded-full backdrop-blur-md">物理映射节点</span>
            </div>
          </div>
          
          <div className="flex-1 space-y-8 w-full">
            {isEditingMetadata ? (
              <div className="glass-dark-morphism p-10 rounded-[3rem] border border-white/10 space-y-8 shadow-2xl bg-black/40">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                  <h3 className="font-black italic text-white text-sm uppercase tracking-widest">节点修正 (V3 Encoding)</h3>
                  <button 
                    onClick={handleLocalCalibrate} 
                    disabled={isProcessing} 
                    className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-400 transition-all"
                  >
                    规则校准
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest ml-2">歌名 (Title)</p>
                    <input value={tempTitle} onChange={e => setTempTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-black text-white outline-none focus:border-indigo-500/50" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest ml-2">歌手 (Artist)</p>
                    <input value={tempArtist} onChange={e => setTempArtist(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-black text-white outline-none focus:border-indigo-500/50" />
                  </div>
                </div>
                
                <div className="space-y-4">
                   <p className="text-[8px] font-black text-white/20 uppercase tracking-widest ml-2">标签分类 (Tags)</p>
                   <input placeholder="#DJ #emo" value={tempTags} onChange={e => setTempTags(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-black text-indigo-400 outline-none focus:border-indigo-500/50 mb-3" />
                   
                   <div className="flex flex-wrap gap-2">
                      {QUICK_TAGS.map(tag => (
                        <button 
                          key={tag} 
                          onClick={() => toggleQuickTag(tag)}
                          className={`px-3 py-1 rounded-lg text-[9px] font-black transition-all border ${tempTags.includes(tag) ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-white/30 hover:text-white'}`}
                        >
                          {tag}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={handleSaveMetadata} disabled={isSaving} className="flex-1 py-5 bg-white text-black rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl active:scale-95">
                    {isSaving ? '同步中...' : '提交 V3 协议更名'}
                  </button>
                  <button onClick={() => setIsEditingMetadata(false)} className="px-8 py-5 glass-morphism text-white/40 rounded-2xl font-black text-[11px] uppercase border border-white/10 hover:text-white transition-all">取消</button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex flex-wrap gap-3">
                  {song.tags?.map(t => (
                    <span key={t} className="px-4 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[9px] font-black uppercase tracking-widest">{t}</span>
                  ))}
                </div>
                <h1 className="text-4xl md:text-8xl font-black text-white tracking-tighter leading-none italic aurora-text">{song.name}</h1>
                <p className="text-xl md:text-3xl font-black text-white/20 tracking-widest uppercase italic">{song.artist}</p>
                <div className="flex gap-4 pt-6">
                   <button onClick={() => setIsEditingMetadata(true)} className="flex items-center gap-4 px-8 py-4 glass-morphism rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10">
                    <i className="fa-solid fa-dna text-indigo-400"></i>
                    <span>分类标签与物理修正</span>
                   </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="space-y-6">
          <Collapse 
            title="共鸣文字映射 (Lyrics)" 
            subtitle="Text Stream Mapping" 
            icon="fa-quote-left" 
            accentColor="cyan"
            defaultOpen={true}
          >
            <div className="pt-8">
              {isEditingLyrics ? (
                <textarea 
                  value={editedLyrics} 
                  onChange={(e) => setEditedLyrics(e.target.value)} 
                  className="w-full h-80 bg-white/5 border border-white/10 rounded-[2rem] p-10 text-2xl font-black italic text-white outline-none focus:border-indigo-500/30" 
                />
              ) : (
                <div className="min-h-[200px] flex items-center justify-center text-center px-6">
                  <p className="text-2xl md:text-5xl font-black text-white italic tracking-tighter max-w-4xl leading-relaxed opacity-90 drop-shadow-2xl">
                    {song.lyrics || "“原来在这个世界上，最昂贵的支票，是你曾随口说出的那个永远。”"}
                  </p>
                </div>
              )}
              <div className="flex justify-end mt-10">
                <button onClick={() => setIsEditingLyrics(!isEditingLyrics)} className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-500/30 pb-1 hover:text-white transition-colors">
                  {isEditingLyrics ? '保存映射' : '修正文字轨迹'}
                </button>
              </div>
            </div>
          </Collapse>

          <Collapse 
            title="物理存储上下文" 
            subtitle="Deep Storage Context" 
            icon="fa-database" 
            accentColor="red"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4">
              <div className="space-y-3">
                 <p className="text-[10px] font-black uppercase text-white/20 tracking-widest">物理路径 (Key)</p>
                 <p className="text-sm font-black font-mono text-indigo-400 break-all">{song.url.split('public/')[1] || 'N/A'}</p>
              </div>
              <div className="space-y-3">
                 <p className="text-[10px] font-black uppercase text-white/20 tracking-widest">文件规格 (Size)</p>
                 <p className="text-sm font-black font-mono text-white">{(song.size ? song.size / 1024 / 1024 : 0).toFixed(2)} MB</p>
              </div>
            </div>
          </Collapse>
        </div>
      </div>
    </div>
  );
};

export default SongDetails;
