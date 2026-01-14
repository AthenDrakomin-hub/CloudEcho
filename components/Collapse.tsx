
import React, { useState } from 'react';

interface CollapseProps {
  title: string;
  subtitle?: string;
  icon?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accentColor?: string;
}

const Collapse: React.FC<CollapseProps> = ({ 
  title, 
  subtitle, 
  icon, 
  children, 
  defaultOpen = false,
  accentColor = 'indigo'
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const accentClasses = {
    indigo: 'border-indigo-500/30 text-indigo-400',
    red: 'border-red-500/30 text-red-500',
    pink: 'border-pink-500/30 text-pink-500',
    cyan: 'border-cyan-500/30 text-cyan-400'
  }[accentColor as keyof typeof accentClasses] || 'border-white/10 text-white';

  return (
    <div className={`group mb-4 transition-all duration-500 ${isOpen ? 'ring-1 ring-white/10' : ''} glass-dark-morphism rounded-[2rem] overflow-hidden border border-white/5`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 md:p-8 hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="flex items-center space-x-6">
          {icon && (
            <div className={`w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 ${isOpen ? accentClasses : 'text-white/20'}`}>
              <i className={`fa-solid ${icon} text-lg`}></i>
            </div>
          )}
          <div>
            <h3 className={`text-sm font-black uppercase tracking-[0.3em] transition-colors ${isOpen ? 'text-white' : 'text-white/40'}`}>
              {title}
            </h3>
            {subtitle && (
              <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-1 italic">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-500 ${isOpen ? 'rotate-180 bg-white/5 text-white' : 'text-white/10'}`}>
          <i className="fa-solid fa-chevron-down text-xs"></i>
        </div>
      </button>

      <div 
        className={`grid transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <div className="p-8 md:p-10 pt-0 border-t border-white/5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Collapse;
