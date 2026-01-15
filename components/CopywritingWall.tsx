
import React, { useState, useEffect } from 'react';
import { Quote, NotificationType } from '../types';
import { EMOTIONAL_QUOTES } from '../constants';

interface CopywritingWallProps {
  onNotify: (message: string, type: NotificationType) => void;
}

const CopywritingWall: React.FC<CopywritingWallProps> = ({ onNotify }) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('全部');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('local_quotes');
    if (stored) {
      setQuotes(JSON.parse(stored));
    } else {
      const initial = EMOTIONAL_QUOTES.map(q => ({
        id: q.id.toString(),
        category: q.category,
        content: q.content,
        createdAt: q.createdAt || Date.now()
      }));
      setQuotes(initial);
      localStorage.setItem('local_quotes', JSON.stringify(initial));
    }
  }, []);

  const saveQuotes = (newQuotes: Quote[]) => {
    setQuotes(newQuotes);
    localStorage.setItem('local_quotes', JSON.stringify(newQuotes));
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const content = formData.get('content') as string;
    const category = formData.get('category') as string;
    if (!content.trim()) return;

    if (editingQuote) {
      const updated = quotes.map(q => q.id === editingQuote.id ? { ...q, content, category } : q);
      saveQuotes(updated);
      onNotify('记录已更正', 'success');
    } else {
      const newQuote: Quote = {
        id: Math.random().toString(36).substring(7),
        content,
        category,
        createdAt: Date.now()
      };
      saveQuotes([newQuote, ...quotes]);
      onNotify('新的感悟已入驻云村', 'success');
    }
    setIsEditorOpen(false);
    setEditingQuote(null);
  };

  const filteredQuotes = activeCategory === '全部' ? quotes : quotes.filter(q => q.category === activeCategory);

  return (
    <div className="h-full flex flex-col bg-[#121212] overflow-y-auto no-scrollbar p-6 md:p-12">
      <header className="max-w-4xl mx-auto w-full mb-12 flex items-end justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-black italic text-white tracking-tighter">云村感悟</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Listen to the echo of soul</p>
        </div>
        <button onClick={() => setIsEditorOpen(true)} className="px-6 py-2 bg-[#C20C0C] text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-900/20">写下感悟</button>
      </header>

      <div className="max-w-4xl mx-auto w-full flex gap-4 mb-12 overflow-x-auto no-scrollbar">
        {['全部', '伤感', '遗憾', '深夜', '浪子'].map(cat => (
          <button 
            key={cat} onClick={() => setActiveCategory(cat)} 
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-white text-black' : 'bg-white/5 text-white/40'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="max-w-4xl mx-auto w-full space-y-6 pb-32">
        {filteredQuotes.map(quote => (
          <div key={quote.id} className="group relative p-8 bg-white/[0.03] border border-white/5 rounded-3xl transition-all hover:bg-white/[0.06]">
            {/* 网易云风格的大双引号 */}
            <div className="absolute top-4 left-4 opacity-5 pointer-events-none">
              <i className="fa-solid fa-quote-left text-6xl"></i>
            </div>
            
            <p className="text-lg md:text-xl font-serif-quote italic text-white/80 leading-relaxed relative z-10">
              {quote.content}
            </p>
            
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#C20C0C]/20 border border-[#C20C0C]/30 flex items-center justify-center">
                  <i className="fa-solid fa-cloud text-[#C20C0C] text-[10px]"></i>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black text-white/60">云村匿名信号</p>
                  <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{new Date(quote.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => { setEditingQuote(quote); setIsEditorOpen(true); }} className="text-white/20 hover:text-white transition-all"><i className="fa-solid fa-pen-nib text-xs"></i></button>
                <button onClick={() => { saveQuotes(quotes.filter(q => q.id !== quote.id)); onNotify('此段回忆已随风而去', 'info'); }} className="text-white/20 hover:text-red-500 transition-all"><i className="fa-solid fa-trash-can text-xs"></i></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isEditorOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="bg-[#181818] border border-white/10 p-8 rounded-[2rem] w-full max-w-xl space-y-6 shadow-2xl">
            <h3 className="text-lg font-black italic text-[#C20C0C]">#写在深夜里的回响</h3>
            <textarea 
              name="content" defaultValue={editingQuote?.content} autoFocus 
              placeholder="分享此时此刻你的共鸣..." 
              className="w-full h-40 bg-white/5 border border-white/5 rounded-2xl p-6 text-sm text-white/80 outline-none focus:border-[#C20C0C]/50 resize-none transition-all"
            />
            <div className="flex gap-4">
              <button type="submit" className="flex-1 py-4 bg-[#C20C0C] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">提交感悟</button>
              <button type="button" onClick={() => { setIsEditorOpen(false); setEditingQuote(null); }} className="px-8 py-4 bg-white/5 text-white/40 rounded-2xl font-black text-xs uppercase tracking-widest">取消</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CopywritingWall;
