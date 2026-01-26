
import React from 'react';

interface PlateProps {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

const Plate: React.FC<PlateProps> = ({ title, subtitle, className = '', children, onClick }) => {
  return (
    <section 
      onClick={onClick}
      className={`relative group bg-gradient-to-br from-[#1a1c20] to-[#0d0e10] border border-white/10 rounded-sm shadow-[10px_10px_30px_#050506] overflow-hidden transition-colors duration-300 ${className} ${onClick ? 'cursor-pointer hover:border-[#00f2ff]/30' : ''}`}
    >
      {/* Header */}
      <div className="px-5 py-3 border-b border-white/5 flex justify-between items-center bg-black/20">
        <div className="font-mono-custom text-[10px] text-[#00f2ff] tracking-[2px] uppercase">
          {title}
        </div>
        {subtitle && (
          <div className="text-[9px] text-white/20 font-mono-custom uppercase">
            {subtitle}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="h-full relative">
        {children}
      </div>
      
      {/* Decorative corners - static to prevent jitter */}
      <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-[#00f2ff]/20"></div>
      <div className="absolute top-0 right-0 w-1 h-1 border-t border-r border-[#00f2ff]/20"></div>
      <div className="absolute bottom-0 left-0 w-1 h-1 border-b border-l border-[#00f2ff]/20"></div>
      <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-[#00f2ff]/20"></div>
    </section>
  );
};

export default Plate;
