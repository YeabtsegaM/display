import React, { useState } from 'react';

interface CompactWinnerNewsProps {
  winStack: number;
  isGameActive: boolean;
  gameState: { gameId?: string };
  className?: string;
}

export function CompactWinnerNews({ winStack, gameState, className = '' }: CompactWinnerNewsProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-r from-emerald-500 to-green-600 backdrop-blur-xl rounded-2xl border border-emerald-400/60 shadow-2xl h-20 transition-all duration-500 hover:scale-105 hover:shadow-3xl ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50 animate-pulse"></div>
      
      {/* Floating particles */}
      <div className="absolute top-2 right-2 w-2 h-2 bg-white/30 rounded-full animate-bounce"></div>
      <div className="absolute bottom-3 left-3 w-1.5 h-1.5 bg-white/20 rounded-full animate-ping"></div>
      
      {/* Main content */}
      <div className="relative z-10 h-full flex items-center justify-between p-3">
        {/* Left side - Icon and Title */}
        <div className="flex items-center gap-3">
          <div className={`text-3xl transform transition-all duration-2000 ${isHovered ? 'scale-125 rotate-12' : 'scale-100'}`}>
            🏆
          </div>
          <div className="flex flex-col">
            <div className="text-sm text-white/80 font-bold uppercase tracking-wider mr-2">
              The Winner Gets
            </div>
            <div className="text-base text-white font-extrabold leading-tight">
              አሸናፊው ያገኛል
            </div>
          </div>
        </div>

        {/* Right side - Value */}
        <div className="text-right">
          <div className="text-xl font-extrabold text-white">
             Br. {winStack.toFixed(2)}
          </div>
          <div className="text-sm text-white/70 font-bold mt-1">
            {gameState.gameId || 'Game ID'}
          </div>
        </div>
      </div>

      {/* Hover effect overlay */}
      {isHovered && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent transition-opacity duration-1000"></div>
      )}
    </div>
  );
}
