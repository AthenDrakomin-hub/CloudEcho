
import React, { useEffect, useState } from 'react';

interface VisualizerProps {
  active?: boolean;
}

const MusicVisualizer: React.FC<VisualizerProps> = ({ active = false }) => {
  const [bars, setBars] = useState<number[]>(Array(12).fill(20));

  useEffect(() => {
    if (!active) {
      setBars(Array(12).fill(5));
      return;
    }
    const interval = setInterval(() => {
      setBars(prev => prev.map(() => Math.floor(Math.random() * 80) + 20));
    }, 150);
    return () => clearInterval(interval);
  }, [active]);

  return (
    <div className="flex items-end gap-1 h-10 mt-5">
      {bars.map((height, idx) => (
        <div 
          key={idx}
          className={`w-1 bg-[#00f2ff] transition-all duration-150 ease-in-out ${active ? 'opacity-80' : 'opacity-20'}`}
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
};

export default MusicVisualizer;
