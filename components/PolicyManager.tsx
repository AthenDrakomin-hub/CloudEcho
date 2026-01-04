
import React, { useState } from 'react';

interface Policy {
  id: string;
  name: string;
  operations: string[];
  roles: string[];
  definition: string;
}

const PolicyManager: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([
    {
      id: '1',
      name: 'Public Read for jingxuanshipin folder',
      operations: ['SELECT', 'GET'],
      roles: ['anon', 'authenticated'],
      definition: '1'
    }
  ]);
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [newName, setNewName] = useState('');
  const [selectedOps, setSelectedOps] = useState<string[]>(['SELECT']);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['authenticated']);
  const [sqlDefinition, setSqlDefinition] = useState('1');

  const operations = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 
    'UPLOAD', 'DOWNLOAD', 'LIST', 'MOVE', 
    'COPY', 'REMOVE', 'CREATE SIGNED URL', 'GET PUBLIC URL'
  ];

  const roles = ['service_role', 'authenticated', 'anon'];

  const toggleOp = (op: string) => {
    setSelectedOps(prev => 
      prev.includes(op) ? prev.filter(o => o !== op) : [...prev, op]
    );
  };

  const handleSave = () => {
    if (!newName.trim()) return;
    const newPolicy: Policy = {
      id: Math.random().toString(36).substring(7),
      name: newName,
      operations: selectedOps,
      roles: selectedRoles,
      definition: sqlDefinition
    };
    setPolicies([...policies, newPolicy]);
    setIsAdding(false);
    // Reset
    setNewName('');
    setSelectedOps(['SELECT']);
    setSqlDefinition('1');
  };

  return (
    <div className="h-full flex flex-col bg-[#020202] p-6 md:p-10 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto w-full space-y-8 pb-20">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black italic text-white tracking-tight">运输政策 (Storage Policies)</h1>
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Manage Bucket Level Permissions</p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="px-6 py-3 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20 active:scale-95 transition-all"
          >
            添加新条款
          </button>
        </header>

        {isAdding && (
          <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Policy Name */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">保单名称 (Policy Name)</label>
              <input 
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="为您的保单起一个描述性名称"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-red-600 transition-all text-white"
                maxLength={50}
              />
              <div className="flex justify-end">
                <span className="text-[10px] text-zinc-700 font-mono">{newName.length} / 50</span>
              </div>
            </div>

            {/* Operations */}
            <div className="space-y-4">
              <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">允许的操作 (Allowed Operations)</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {operations.map(op => (
                  <button
                    key={op}
                    onClick={() => toggleOp(op)}
                    className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase transition-all border ${selectedOps.includes(op) ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/10' : 'bg-white/5 border-white/5 text-zinc-500 hover:text-white hover:border-white/10'}`}
                  >
                    {op}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-zinc-600 italic">SELECT 已被自动选中 UPDATE 并需要它 DELETE</p>
            </div>

            {/* Target Roles */}
            <div className="space-y-4">
              <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">目标角色 (Target Roles)</label>
              <div className="flex flex-wrap gap-3">
                {roles.map(role => (
                  <button
                    key={role}
                    onClick={() => setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role])}
                    className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all border ${selectedRoles.includes(role) ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-transparent text-zinc-600'}`}
                  >
                    {role.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* SQL Definition */}
            <div className="space-y-4">
              <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">政策定义 (Policy Definition)</label>
              <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 overflow-hidden">
                <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex items-center space-x-2">
                   <div className="w-2.5 h-2.5 rounded-full bg-red-600"></div>
                   <span className="text-[10px] text-zinc-500 font-mono uppercase">SQL Editor</span>
                </div>
                <textarea 
                  value={sqlDefinition}
                  onChange={e => setSqlDefinition(e.target.value)}
                  className="w-full h-32 bg-transparent p-6 text-red-500 font-mono text-sm focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4">
              <button onClick={() => setIsAdding(false)} className="px-6 py-3 text-[10px] font-black uppercase text-zinc-500 hover:text-white transition-colors">取消</button>
              <button onClick={handleSave} className="px-10 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase hover:bg-zinc-200 transition-all active:scale-95 shadow-xl">应用政策</button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <label className="text-[11px] font-black text-zinc-700 uppercase tracking-widest">现有政策 ({policies.length})</label>
          <div className="space-y-4">
            {policies.map(p => (
              <div key={p.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-[1.5rem] flex items-center justify-between group hover:bg-white/[0.04] transition-all">
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-white">{p.name}</h4>
                  <div className="flex items-center space-x-2">
                    {p.operations.slice(0, 3).map(op => (
                      <span key={op} className="text-[8px] bg-red-600/10 text-red-500 border border-red-600/20 px-2 py-0.5 rounded font-black uppercase">{op}</span>
                    ))}
                    {p.operations.length > 3 && <span className="text-[8px] text-zinc-600 font-black">+ {p.operations.length - 3}</span>}
                    <span className="mx-2 text-zinc-800 text-xs">|</span>
                    <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Target: {p.roles.join(', ')}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setPolicies(policies.filter(x => x.id !== p.id))}
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-700 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100"
                >
                  <i className="fa-solid fa-trash-can text-sm"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyManager;
