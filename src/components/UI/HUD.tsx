import React from 'react';

interface HUDProps {
  syncP: number;
  scrollSpeed: number;
  onSpeedChange: (amt: number) => void;
}

const HUD: React.FC<HUDProps> = ({ syncP, scrollSpeed, onSpeedChange}) => {

return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
      <div className="bg-black/90 border border-yellow-500/30 backdrop-blur-md rounded-md flex flex-row items-center gap-10 font-mono text-yellow-500 !pl-10 !pr-10 py-4 shadow-2xl">
        
        <div className="flex items-center gap-4">
          <span className="text-[20px] opacity-50 uppercase tracking-[0.2em]">Sync</span>
          <span className={`text-4xl font-black italic tabular-nums ${syncP > 85 ? 'text-green-400' : 'text-yellow-500'}`}>
            {syncP}%
          </span>
        </div>

        <div className="w-px h-6 bg-yellow-500/20" />
  
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-[20px] opacity-50 uppercase tracking-[0.2em]">Spd</span>
            <span className="text-xl font-bold w-12 tabular-nums">{scrollSpeed.toFixed(1)}</span>
          </div>

          <div className="flex border border-yellow-500/40 rounded-lg overflow-hidden bg-stone-950 shadow-inner">
            <button 
              onClick={() => onSpeedChange(-0.5)}
              className="px-5 py-2 hover:bg-yellow-500 hover:text-black active:bg-yellow-600 transition-all border-r border-yellow-500/40 text-xl font-black flex items-center justify-center min-w-[50px]"
            >
              -
            </button>
            <button 
              onClick={() => onSpeedChange(0.5)}
              className="px-5 py-2 hover:bg-yellow-500 hover:text-black active:bg-yellow-600 transition-all text-xl font-black flex items-center justify-center min-w-[50px]"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HUD;