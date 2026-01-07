
import React, { useState } from 'react';
import { Song } from '../types';
import { renameSong, saveVirtualName } from '../services/s3Service';
import { localTranslate } from '../services/translationService';

interface SongDetailsProps {
  song: Song;
  onBack: () => void;
  onUpdate: (song: Song) => void;
}

const SongDetails: React.FC<SongDetailsProps> = ({ song, onBack, onUpdate }) => {
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [isEditingLyrics, setIsEditingLyrics] = useState(false);
  const [editedLyrics, setEditedLyrics] = useState(song.lyrics || '');
  
  const [tempArtist, setTempArtist] = useState(song.artist);
  const [tempTitle, setTempTitle] = useState(song.name);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveLyrics = () => {
    onUpdate({ ...song, lyrics: editedLyrics });
    setIsEditingLyrics(false);
  };

  const handleQuickTranslate = () => {
    setTempTitle(localTranslate(tempTitle));
    setTempArtist(localTranslate(tempArtist));
  };

  const handleSaveMetadata = async (mode: 'virtual' | 'physical') => {
    if (!tempArtist.trim() || !tempTitle.trim()) {
      alert('请填写艺术家和曲目名称');
      return;
    }

    setIsSaving(true);
    try {
      if (mode === 'physical') {
        const success = await renameSong(song.url, tempArtist, tempTitle);
        if (!success) throw new Error("S3 物理更名失败");
      }
      
      // 无论哪种模式，都更新本地映射，确保 UI 优先显示用户定义的中文名
      await saveVirtualName(song.id, tempTitle);
      
      onUpdate({ ...song, artist: tempArtist, name: tempTitle });
      setIsEditingMetadata(false);
      onBack(); 
    } catch (err: any) {
      console.error("Rename UI Error:", err);
      alert(`重命名失败: ${err.message || '未知错误'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getWordCount = (text: string) => {
    if (!text) return 0;
    const cleanText = text.trim();
    const cjkMatch = cleanText.match(/[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]/g) || [];
    const latinText = cleanText.replace(/[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]/g, ' ');
    const latinWords = latinText.split(/\s+/).filter(word => word.length > 0);
    return cjkMatch.length + latinWords.length;
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-10 overflow-y-auto relative bg-zinc-950/40 custom-scrollbar">
      <div 
        className="absolute inset-0 -z-10 opacity-20 blur-[120px] scale-110 pointer-events-none"
        style={{ backgroundImage: `url(${song.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      ></div>

      <div className="max-w-5xl mx-auto w-full space-y-10 pb-20">
        <nav className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-all group py-2">
            <i className="fa-solid fa-chevron-left text-sm transition-transform group-hover:-translate-x-1"></i>
            <span className="font-medium text-sm">返回曲库</span>
          </button>
        </nav>

        <section className="flex flex-col md:flex-row items-center md:items-end gap-8 md:gap-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="relative group flex-shrink-0">
            <div className="w-56 h-56 md:w-72 md:h-72 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.7)] border border-white/10 bg-cover bg-center overflow-hidden transition-transform duration-500 group-hover:scale-[1.02]"
              style={{ backgroundImage: `url(${song.coverUrl})` }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-6 min-w-0 w-full">
            <div className="space-y-3">
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-md bg-red-600/20 text-red-500 text-[10px] font-black uppercase tracking-tighter border border-red-600/20"># 映射记录详情</span>
              </div>

              {isEditingMetadata ? (
                <div className="space-y-4 max-w-lg mx-auto md:mx-0">
                  <div className="flex items-end gap-3">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">显示名称 (中文)</label>
                      <input value={tempTitle} onChange={(e) => setTempTitle(e.target.value)} className="w-full bg-zinc-900/80 border border-white/10 rounded-2xl px-5 py-3 text-xl font-bold text-white focus:outline-none focus:border-red-600 transition-all" />
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={handleQuickTranslate} title="快速词典翻译" className="h-12 w-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-all shrink-0">
                        <i className="fa-solid fa-language"></i>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">艺术家</label>
                    <input value={tempArtist} onChange={(e) => setTempArtist(e.target.value)} className="w-full bg-zinc-900/80 border border-white/10 rounded-2xl px-5 py-3 text-sm text-zinc-300 focus:outline-none focus:border-red-600 transition-all" />
                  </div>
                  <div className="flex flex-col space-y-3 pt-4">
                    <div className="flex items-center space-x-3">
                      <button onClick={() => handleSaveMetadata('virtual')} disabled={isSaving} className="flex-1 py-3 bg-white/10 text-white border border-white/5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all shadow-xl">
                        仅保存虚拟映射 (不改 S3 文件名)
                      </button>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button onClick={() => handleSaveMetadata('physical')} disabled={isSaving} className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 transition-all flex items-center justify-center space-x-2 shadow-xl shadow-red-600/20">
                        {isSaving ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-server"></i>}
                        <span>同步至云端 (重命名 S3 文件)</span>
                      </button>
                      <button onClick={() => setIsEditingMetadata(false)} className="px-6 py-3 bg-white/5 text-zinc-400 rounded-2xl font-medium">取消</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="group relative md:pr-12 inline-block w-full">
                  <h1 className="text-3xl md:text-6xl font-black text-white tracking-tighter leading-tight break-words">{song.name}</h1>
                  <p className="text-lg md:text-2xl text-zinc-400 font-medium mt-1 truncate">{song.artist}</p>
                  <button onClick={() => setIsEditingMetadata(true)} className="md:absolute md:top-2 md:-right-4 w-10 h-10 rounded-xl bg-white/5 border border-white/5 md:opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-zinc-400 hover:text-red-500 mt-4 md:mt-0">
                    <i className="fa-solid fa-pen-nib text-sm"></i>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <div className="group relative p-1 rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent">
            <div className="bg-zinc-900/80 backdrop-blur-2xl rounded-[2.4rem] p-6 md:p-14 border border-white/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-12 gap-6">
                <div className="flex flex-col space-y-1">
                  <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center space-x-3">
                    <i className="fa-solid fa-microphone-lines text-red-600 text-lg"></i>
                    <span>深夜文字映射 (Memory Fragments)</span>
                  </h3>
                  {!isEditingLyrics && song.lyrics && (
                    <span className="text-[9px] text-zinc-600 font-bold md:ml-9">共 {getWordCount(song.lyrics)} 字</span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  {isEditingLyrics ? (
                    <div className="flex items-center space-x-2 w-full md:w-auto">
                      <button onClick={handleSaveLyrics} className="flex-1 md:px-6 py-2.5 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-red-500 transition-all">保存</button>
                      <button onClick={() => setIsEditingLyrics(false)} className="flex-1 md:px-6 py-2.5 bg-white/5 text-zinc-400 rounded-xl text-[10px] font-black uppercase transition-all">取消</button>
                    </div>
                  ) : (
                    <button onClick={() => setIsEditingLyrics(true)} className="px-5 py-2.5 bg-white/5 border border-white/5 rounded-2xl text-zinc-400 text-[10px] font-black uppercase hover:text-white hover:bg-white/10 transition-all flex items-center space-x-2">
                      <i className="fa-solid fa-feather-pointed"></i>
                      <span>记录感触</span>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="relative min-h-[300px]">
                {isEditingLyrics ? (
                  <textarea value={editedLyrics} onChange={(e) => setEditedLyrics(e.target.value)} placeholder="深夜总是有些话想说..." className="w-full h-[300px] md:h-[400px] bg-black/30 border border-white/10 rounded-3xl p-6 md:p-8 text-zinc-200 text-base md:text-lg leading-relaxed focus:outline-none focus:border-red-600/50 transition-all resize-none font-light italic custom-scrollbar" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center space-y-6 py-10 px-4">
                    <div className="max-w-3xl w-full">
                      {song.lyrics ? (
                        <p className="text-zinc-300 text-lg md:text-2xl leading-[2.2] whitespace-pre-wrap font-light italic break-words">{song.lyrics}</p>
                      ) : (
                        <div className="flex flex-col items-center space-y-4 py-12 text-zinc-600 italic">
                          <i className="fa-solid fa-ghost text-4xl mb-2 opacity-20"></i>
                          <p className="text-sm">这里空空如也。点击上方按钮留下此刻的记忆碎片。</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SongDetails;
