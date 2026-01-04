
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
          <h1 className="text-4xl font-bold text-white tracking-tight">分享中心</h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            你可以通过映射链接，让其他人通过网页直接欣赏你的曲库。系统会自动隐藏你的管理权限，确保安全。
          </p>
        </header>

        <section className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">网页映射播放器</h2>
            <span className="text-[10px] text-green-500 font-bold px-2 py-0.5 bg-green-500/10 rounded-full">服务正常</span>
          </div>
          
          <div className="bg-black/40 rounded-2xl p-6 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
             <div className="flex-1">
                <p className="text-[10px] text-zinc-600 font-bold uppercase mb-2">分享地址</p>
                <code className="text-red-600 font-mono text-xs">{sharedUrl}</code>
             </div>
             <button 
                onClick={copyLink}
                className={`px-6 py-3 rounded-xl font-bold text-xs transition-all ${copied ? 'bg-green-600' : 'bg-red-600 hover:bg-red-500'} text-white shadow-lg shadow-red-600/10`}
             >
                {copied ? '已复制' : '复制分享链接'}
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-white/[0.02] rounded-2xl border border-white/5">
              <h4 className="text-[10px] font-bold text-white uppercase mb-2">安全保护</h4>
              <p className="text-[11px] text-zinc-600 leading-relaxed">访客模式会自动剥离所有修改和删除功能。</p>
            </div>
            <div className="p-5 bg-white/[0.02] rounded-2xl border border-white/5">
              <h4 className="text-[10px] font-bold text-white uppercase mb-2">全库映射</h4>
              <p className="text-[11px] text-zinc-600 leading-relaxed">所有在 free music 文件夹下的音频文件都将实时同步给访客。</p>
            </div>
          </div>
        </section>

        <footer className="text-center pt-10 opacity-20">
           <p className="text-[10px] uppercase font-bold tracking-[0.4em]">Simple Cloud Music Share · 2026</p>
        </footer>
      </div>
    </div>
  );
};

export default ApiDocs;
