
import React, { useState, useMemo } from 'react';
import { EDGE_FUNCTION_CONFIG, S3_CONFIG } from '../constants';

const ApiDocs: React.FC = () => {
  const baseUrl = window.location.origin + window.location.pathname;
  const sharedUrl = `${baseUrl}?mode=shared`;
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'copywriting' | 'api'>('link');

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(sharedUrl)}&bgcolor=000&color=fff&margin=10`;

  const COPY_TEMPLATES = [
    { label: '深情款', text: `🌌 子夜已深，我在“网忆云”留了一封没有寄出的信。进去听听看吗？\n🔗 空间映射：${sharedUrl} #网忆云 #子夜回响` },
    { label: '节奏律动', text: `🔥 这里的 DJ 震得碎耳膜，却震不碎我这份落寞。极光蹦迪台已上线：\n🔗 空间映射：${sharedUrl} #DJ #回响` },
    { label: '感伤遗憾', text: `🍂 我这辈子收到了很多空头支票，你的永远也是。进来看看我们的遗憾：\n🔗 空间映射：${sharedUrl} #emo #这辈子` },
    { label: '极客观点', text: `📈 映射未来，复利共鸣。听听这里的财经观点和人性江湖：\n🔗 空间映射：${sharedUrl} #金融播客 #人物志` }
  ];

  const API_METHODS = [
    { 
        method: 'GET', 
        path: '/list', 
        desc: '获取云端全量映射信号库', 
        params: '存储桶, 前缀',
        color: 'text-emerald-400'
    },
    { 
        method: 'POST', 
        path: '/upload', 
        desc: '映射新音频轨迹至云端', 
        params: '文件, 路径',
        color: 'text-blue-400'
    },
    { 
        method: 'DELETE', 
        path: '/delete', 
        desc: '从物理存储中永久抹除记录', 
        params: '路径',
        color: 'text-red-400'
    }
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full p-6 md:p-12 lg:p-20 overflow-y-auto bg-transparent custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-16 pb-24">
        
        <header className="space-y-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-8">
             <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.3)] animate-pulse">
                <i className="fa-solid fa-paper-plane text-white text-2xl"></i>
             </div>
             <div className="space-y-1">
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter italic leading-none aurora-text">分享中心</h1>
                <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.5em]">映射共享门户 · Mapping Share Portal</p>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          
          <section className="lg:col-span-2">
             <div className="relative group perspective-1000">
                <div className="w-full bg-[#121212]/70 backdrop-blur-3xl rounded-[2.5rem] border border-white/20 p-8 md:p-10 flex flex-col space-y-10 transition-all duration-500 shadow-2xl relative">
                   
                   <div className="space-y-6">
                      <div className="flex items-center space-x-4">
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                            <i className="fa-solid fa-music text-black text-sm"></i>
                         </div>
                         <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">信号节点</p>
                            <p className="text-xs font-black text-white italic">极光同步 · AURORA</p>
                         </div>
                      </div>
                      <div>
                        <h2 className="text-2xl font-black italic tracking-tighter leading-tight text-white">子夜回响 · 空间映射</h2>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-white/20 mt-2 italic leading-relaxed">
                          维度映射已建立，请扫描下方波段信号。
                        </p>
                      </div>
                   </div>

                   <div className="flex flex-col items-center space-y-6 pt-4 border-t border-white/5">
                      <div className="p-3 bg-white rounded-2xl shadow-2xl ring-4 ring-indigo-500/10">
                         <img src={qrUrl} className="w-32 h-32 md:w-48 md:h-48" alt="二维码" />
                      </div>
                      <div className="flex items-center space-x-3 opacity-40">
                         <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                         <span className="text-[8px] font-black uppercase tracking-widest text-white">等待接入信号...</span>
                      </div>
                   </div>
                </div>
             </div>
          </section>

          <section className="lg:col-span-3 space-y-8">
             <div className="bg-white/5 rounded-[2.5rem] p-8 md:p-10 border border-white/5 space-y-8 shadow-xl">
                
                <div className="flex p-1 bg-black/40 rounded-2xl w-fit border border-white/5">
                   {[
                     { id: 'link', label: '映射链接' },
                     { id: 'copywriting', label: '文案模板' },
                     { id: 'api', label: '核心接口' }
                   ].map(tab => (
                     <button 
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-black shadow-lg' : 'text-white/30 hover:text-white'}`}
                     >
                       {tab.label}
                     </button>
                   ))}
                </div>

                {activeTab === 'link' && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="space-y-4">
                       <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-3">
                          <i className="fa-solid fa-link text-indigo-400"></i>
                          共享映射地址
                       </h3>
                       <div className="bg-black/60 rounded-2xl p-6 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 group">
                          <code className="text-indigo-400 font-mono text-xs break-all font-black flex-1 pr-4">{sharedUrl}</code>
                          <button 
                            onClick={() => copyToClipboard(sharedUrl)}
                            className={`w-full md:w-auto px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${copied ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-indigo-500 hover:text-white shadow-lg'}`}
                          >
                            {copied ? '已成功复制' : '复制地址'}
                          </button>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                          <h4 className="text-[10px] font-black text-white uppercase tracking-widest italic">子夜回响 (音频)</h4>
                          <p className="text-[9px] text-white/30 font-bold italic">支持实时文案映射的加密音频流</p>
                       </div>
                       <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                          <h4 className="text-[10px] font-black text-white uppercase tracking-widest italic">深夜映画 (视频)</h4>
                          <p className="text-[9px] text-white/30 font-bold italic">精选的云端物理视频映射</p>
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === 'copywriting' && (
                  <div className="space-y-4 animate-in fade-in duration-500">
                    {COPY_TEMPLATES.map((tmpl, idx) => (
                      <div 
                        key={idx}
                        onClick={() => copyToClipboard(tmpl.text)}
                        className="p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group flex flex-col gap-3 shadow-inner"
                      >
                         <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black uppercase text-indigo-400 italic">模板: {tmpl.label}</span>
                            <i className="fa-solid fa-copy text-white/10 group-hover:text-white transition-colors text-xs"></i>
                         </div>
                         <p className="text-xs font-bold text-white/60 leading-relaxed italic">{tmpl.text.split('\n')[0]}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'api' && (
                   <div className="space-y-6 animate-in fade-in duration-500">
                      <div className="space-y-3">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">API 端点 (Endpoint)</p>
                        <div className="bg-black/60 rounded-xl p-4 border border-white/5 flex items-center justify-between gap-4">
                           <code className="text-emerald-400 font-mono text-[10px] break-all">{EDGE_FUNCTION_CONFIG.baseUrl}</code>
                           <button onClick={() => copyToClipboard(EDGE_FUNCTION_CONFIG.baseUrl)} className="text-white/20 hover:text-white transition-colors"><i className="fa-solid fa-copy text-xs"></i></button>
                        </div>
                      </div>

                      <div className="space-y-3">
                         <p className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">调用方法 (Methods)</p>
                         {API_METHODS.map((m, idx) => (
                            <div key={idx} className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between shadow-sm">
                               <div className="flex items-center space-x-4">
                                  <span className={`text-[9px] font-black uppercase ${m.color}`}>{m.method}</span>
                                  <span className="text-[10px] font-bold text-white/70">{m.desc}</span>
                                </div>
                                <span className="text-[8px] text-white/20 font-mono italic">{m.path}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                )}
             </div>

             <div className="p-6 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl shadow-lg">
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-relaxed italic">
                   提示：分享模式已开启。通过该地址进入的访客仅具有“只读”权限，物理抹除与重命名操作将被锁定。
                </p>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ApiDocs;
