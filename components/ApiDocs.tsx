
import React, { useState } from 'react';

const ApiDocs: React.FC = () => {
  const baseUrl = window.location.origin + window.location.pathname;
  const sharedUrl = `${baseUrl}?mode=shared`;
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(sharedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full p-10 overflow-y-auto bg-[#020202]">
      <div className="max-w-3xl mx-auto space-y-12">
        <header className="space-y-4">
          <div className="flex items-center space-x-4">
             <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-600/20">
                <i className="fa-solid fa-share-nodes text-white text-xl"></i>
             </div>
             <h1 className="text-4xl font-black text-white tracking-tighter italic">映射分享中心</h1>
          </div>
          <p className="text-zinc-500 text-sm leading-relaxed max-w-xl">
            映射链接现已升级为<strong>全功能视听空间 (V-Space)</strong>。通过一个链接，访客即可在您的私有音乐库与精选放映厅之间自由切换，享受完整的沉浸式体验。
          </p>
        </header>

        <section className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="text-sm font-black text-white uppercase tracking-widest">全局视听映射 (V-Space)</h2>
              <p className="text-[10px] text-zinc-600 font-bold mt-1">Status: Fully Operational</p>
            </div>
            <span className="text-[10px] text-green-500 font-black px-3 py-1 bg-green-500/10 rounded-full border border-green-500/10">同步就绪</span>
          </div>
          
          <div className="bg-black/40 rounded-3xl p-8 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
             <div className="flex-1 truncate w-full">
                <p className="text-[10px] text-zinc-600 font-black uppercase mb-3 tracking-widest">您的专属映射地址</p>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <code className="text-red-600 font-mono text-xs break-all">{sharedUrl}</code>
                </div>
             </div>
             <button 
                onClick={copyLink}
                className={`w-full md:w-auto px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${copied ? 'bg-green-600' : 'bg-red-600 hover:bg-red-500'} text-white shadow-2xl shadow-red-600/20 active:scale-95`}
             >
                {copied ? 'Link Saved' : 'Copy Share Link'}
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 bg-white/[0.02] rounded-3xl border border-white/5 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <i className="fa-solid fa-compact-disc text-zinc-400 text-xs"></i>
              </div>
              <h4 className="text-[11px] font-black text-white uppercase tracking-widest">子夜旋律 (Audio)</h4>
              <p className="text-[11px] text-zinc-600 leading-relaxed font-bold">访客可聆听您在 `free music` 目录下的所有音频，支持黑胶动态视觉。</p>
            </div>
            <div className="p-8 bg-white/[0.02] rounded-3xl border border-white/5 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <i className="fa-solid fa-clapperboard text-zinc-400 text-xs"></i>
              </div>
              <h4 className="text-[11px] font-black text-white uppercase tracking-widest">深夜映画 (Video)</h4>
              <p className="text-[11px] text-zinc-600 leading-relaxed font-bold">实时同步 `jingxuanshipin` 目录下的影片，支持 4K/1080P 沉浸式放映。</p>
            </div>
          </div>
        </section>

        <section className="bg-red-600/5 border border-red-600/10 rounded-3xl p-8">
           <div className="flex items-start space-x-4">
              <i className="fa-solid fa-shield-halved text-red-600 mt-1"></i>
              <div className="space-y-1">
                 <h4 className="text-[11px] font-black text-white uppercase tracking-widest">隐身安全与权限隔离</h4>
                 <p className="text-[11px] text-zinc-500 font-bold leading-relaxed">分享页面采用完全只读架构。所有涉及修改的操作（上传、删除、重命名）均已从客户端界面中移除，并受服务端 Key 验证保护。访客仅能浏览与播放。</p>
              </div>
           </div>
        </section>

        <footer className="text-center pt-10 opacity-20">
           <p className="text-[10px] uppercase font-black tracking-[0.5em] text-zinc-500 italic">Nocturne Space · High-End Mapping Solutions</p>
        </footer>
      </div>
    </div>
  );
};

export default ApiDocs;
