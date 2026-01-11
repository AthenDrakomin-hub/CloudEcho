
import React, { useState, useMemo } from 'react';

const ApiDocs: React.FC = () => {
  const baseUrl = window.location.origin + window.location.pathname;
  const sharedUrl = `${baseUrl}?mode=shared`;
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'copywriting'>('link');

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(sharedUrl)}&bgcolor=000&color=fff&margin=10`;

  const COPY_TEMPLATES = [
    { label: '深情款', text: `🌌 子夜已深，我在“网忆云”留了一封没有寄出的信。进去听听看吗？\n🔗 空间映射：${sharedUrl} #网易云 #子夜回响` },
    { label: 'DJ 热血款', text: `🔥 这里的 DJ 震得碎耳膜，却震不碎我这份落寞。极光蹦迪台已上线：\n🔗 空间映射：${sharedUrl} #DJ #蹦迪` },
    { label: 'emo 遗憾款', text: `🍂 我这辈子收到了很多空头支票，你的永远也是。进来看看我们的遗憾：\n🔗 空间映射：${sharedUrl} #emo #这辈子` },
    { label: '金融极客款', text: `📈 映射未来，复利共鸣。听听这里的财经观点和人性江湖：\n🔗 空间映射：${sharedUrl} #金融播客 #人物志` }
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full p-6 md:p-12 lg:p-20 overflow-y-auto bg-transparent custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-20 pb-24">
        
        {/* 头部标题区 */}
        <header className="space-y-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-8">
             <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.5)] rotate-12 animate-pulse">
                <i className="fa-solid fa-paper-plane text-white text-3xl"></i>
             </div>
             <div className="space-y-2">
                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter italic leading-none aurora-text">分享中心</h1>
                <p className="text-[11px] text-white/30 font-black uppercase tracking-[0.6em]">Visual Perception Mapping Share · v4.2</p>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          
          {/* 左侧：3D 预览卡片 */}
          <section className="lg:col-span-2 space-y-8">
             <div className="relative group perspective-3000">
                <div className="w-full aspect-[3/4] glass-dark-morphism rounded-[3.5rem] border border-white/20 p-10 flex flex-col justify-between transition-all duration-700 group-hover:rotate-y-12 group-hover:scale-105 shadow-[0_100px_200px_-50px_rgba(0,0,0,0.8)] overflow-hidden">
                   {/* 背景极光流体 */}
                   <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-pink-500/20 -z-10 animate-pulse"></div>
                   <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full"></div>
                   
                   <div className="space-y-6">
                      <div className="flex items-center space-x-4">
                         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center">
                            <i className="fa-solid fa-music text-black text-xl"></i>
                         </div>
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Node ID</p>
                            <p className="text-sm font-black text-white">AURORA-SYNC-001</p>
                         </div>
                      </div>
                      <div className="pt-4">
                        <h2 className="text-3xl font-black italic tracking-tighter leading-tight text-white">网忆云<br/>子夜回响</h2>
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mt-3 italic leading-relaxed">
                          感知维度已建立映射，进入空间捕获音频信号与情感文字。
                        </p>
                      </div>
                   </div>

                   <div className="space-y-8 flex flex-col items-center">
                      <div className="p-4 bg-white rounded-3xl shadow-2xl ring-4 ring-indigo-500/20">
                         <img src={qrUrl} className="w-40 h-40" alt="QR Code" />
                      </div>
                      <div className="flex items-center space-x-3">
                         <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_green]"></span>
                         <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Live Sync Mapping Ready</span>
                      </div>
                   </div>
                </div>
             </div>
             <p className="text-center text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">由极光引擎生成实时预览</p>
          </section>

          {/* 右侧：操作区 */}
          <section className="lg:col-span-3 space-y-10">
             <div className="bg-white/5 rounded-[3.5rem] p-10 border border-white/5 space-y-10 shadow-2xl">
                
                {/* 选项卡切换 */}
                <div className="flex p-1.5 bg-black/40 rounded-[2rem] w-fit border border-white/5">
                   <button 
                    onClick={() => setActiveTab('link')}
                    className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'link' ? 'bg-white text-black shadow-lg scale-105' : 'text-white/30 hover:text-white'}`}
                   >
                     同步链接
                   </button>
                   <button 
                    onClick={() => setActiveTab('copywriting')}
                    className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'copywriting' ? 'bg-white text-black shadow-lg scale-105' : 'text-white/30 hover:text-white'}`}
                   >
                     共鸣文案
                   </button>
                </div>

                {activeTab === 'link' ? (
                  <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
                    <div className="space-y-4">
                       <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-3">
                          <i className="fa-solid fa-link text-indigo-400"></i>
                          空间分发地址 (V-Link)
                       </h3>
                       <div className="bg-black/60 rounded-3xl p-8 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 shadow-inner group overflow-hidden">
                          <code className="text-indigo-400 font-mono text-sm break-all font-black flex-1 pr-4">{sharedUrl}</code>
                          <button 
                            onClick={() => copyToClipboard(sharedUrl)}
                            className={`w-full md:w-auto px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-2xl active:scale-95 ${copied ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-indigo-500 hover:text-white'}`}
                          >
                            {copied ? '映射已复制' : '复制地址'}
                          </button>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-4 hover:border-indigo-500/30 transition-all group">
                          <i className="fa-solid fa-microphone-lines text-indigo-400 text-xl group-hover:scale-125 transition-transform"></i>
                          <h4 className="text-[11px] font-black text-white uppercase tracking-widest">子夜回响 (Audio)</h4>
                          <p className="text-[10px] text-white/40 leading-relaxed font-bold italic">访客可以聆听您的云端音频流，支持实时文案映射。</p>
                       </div>
                       <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-4 hover:border-pink-500/30 transition-all group">
                          <i className="fa-solid fa-clapperboard text-pink-500 text-xl group-hover:scale-125 transition-transform"></i>
                          <h4 className="text-[11px] font-black text-white uppercase tracking-widest">深夜映画 (Video)</h4>
                          <p className="text-[10px] text-white/40 leading-relaxed font-bold italic">访客可以观看您精选的云端视频记录，完全响应式体验。</p>
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-3 mb-6">
                      <i className="fa-solid fa-quote-left text-pink-400"></i>
                      分发文案模版 (Sharing Presets)
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                       {COPY_TEMPLATES.map((tmpl, idx) => (
                         <div 
                          key={idx}
                          onClick={() => copyToClipboard(tmpl.text)}
                          className="p-6 bg-white/5 border border-white/5 rounded-[2rem] hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group flex flex-col gap-4 shadow-xl"
                         >
                            <div className="flex items-center justify-between">
                               <span className="px-4 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[9px] font-black uppercase tracking-widest">{tmpl.label}</span>
                               <i className="fa-solid fa-copy text-white/10 group-hover:text-white transition-colors"></i>
                            </div>
                            <p className="text-[12px] font-bold text-white/60 leading-relaxed italic group-hover:text-white transition-colors">{tmpl.text.split('\n')[0]}</p>
                         </div>
                       ))}
                    </div>
                  </div>
                )}
             </div>

             <div className="bg-gradient-to-r from-indigo-600/10 to-transparent border-l-4 border-indigo-500 p-8 rounded-r-[2.5rem] space-y-2">
                <p className="text-xs font-black text-white uppercase tracking-widest">安全警示 (Safe Node)</p>
                <p className="text-[10px] text-white/30 font-bold italic tracking-wide">分享模式下，任何访客都无法访问管理后台、删除文件或修改系统配置。</p>
             </div>
          </section>
        </div>

        <footer className="text-center py-20 opacity-20">
           <p className="text-[10px] uppercase font-black tracking-[1em] text-white italic">AURORA CLOUD SYNC · END OF SUBCONSCIOUS</p>
        </footer>
      </div>
    </div>
  );
};

export default ApiDocs;
