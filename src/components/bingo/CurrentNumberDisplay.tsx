import React from 'react';
import { getColumnForNumber, getRecentNumbers } from '../../lib/utils';
import type { GameState } from '../../types';

interface CurrentNumberDisplayProps {
  gameState: GameState;
  isDrawing: boolean;
  className?: string;
}

export function CurrentNumberDisplay({ gameState, isDrawing, className = '' }: CurrentNumberDisplayProps) {
  const { currentNumber, currentColumn, calledNumbers, gameStatus } = gameState;
  
  const recentNumbers = getRecentNumbers(calledNumbers, 3);

  return (
    <div className={`flex flex-col items-center ${className}`} data-current-number-card>
      <div className="relative mb-3 lg:mb-4">
        {/* Outer Glow Ring */}
        <div className="absolute inset-0 w-50 h-50 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full blur-lg"></div>
        
        {/* Main Circle */}
        <div className="relative w-50 h-50 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 hover:scale-105 group">
          
          {/* Animated Background Balls */}
          <div className="absolute inset-0 w-50 h-50 rounded-full overflow-hidden">
            {Array.from({ length: 12 }, (_, i) => {
              const angle = (i / 12) * 2 * Math.PI;
              const radius = 18;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              
              return (
                <div
                  key={i}
                  className="absolute top-1/2 left-1/2 w-2 h-2 transform -translate-x-1/2 -translate-y-1/2 opacity-20"
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: `${3 + i * 0.5}s`
                  }}
                >
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-white/30 to-white/10 blur-sm animate-pulse"></div>
                </div>
              );
            })}
          </div>
          
          {/* Main Circle with Gradients */}
          <div className="relative w-50 h-50 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-500 shadow-2xl border-4 border-white-200/50 overflow-hidden">
            
            {/* Animated Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer"></div>
            
            {/* Inner Glow Ring */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-400/50 to-orange-500/50 blur-sm"></div>
            
            {/* Main Content Circle */}
            <div className="relative w-44 h-44 rounded-full flex flex-col items-center justify-center bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-600 shadow-inner border-2 border-yellow-200/30 backdrop-blur-sm">
              
              {/* Content */}
              {currentNumber ? (
                <>
                  <div className="text-lg font-black text-black/90 mb-1 tracking-wider drop-shadow-sm animate-pulse">
                    {currentColumn}
                  </div>
                  <div className="text-4xl font-black text-black drop-shadow-lg animate-bounce">
                    {currentNumber}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300/20 to-orange-400/20 animate-ping"></div>
                </>
              ) : gameStatus === 'active' && calledNumbers.length > 0 ? (
                <>
                  <div className="text-lg font-black text-black/90 mb-1 tracking-wider drop-shadow-sm">
                    {getColumnForNumber(calledNumbers[calledNumbers.length - 1])}
                  </div>
                  <div className="text-4xl font-black text-black drop-shadow-lg animate-pulse">
                    {calledNumbers[calledNumbers.length - 1]}
                  </div>
                </>
              ) : gameStatus === 'active' ? (
                <div className="text-lg font-black text-black/90 text-center leading-tight animate-pulse">
                  Game<br />Active
                </div>
              ) : (
                <div className="text-lg font-black text-black/90 text-center leading-tight group-hover:scale-110 transition-transform duration-300">
                  Ready to<br />Start
                </div>
              )}
              
              {/* Modern highlight effect */}
              <div className="absolute top-2 left-2 w-4 h-4 bg-white/40 rounded-full blur-sm"></div>
              <div className="absolute top-3 left-3 w-2 h-2 bg-white/60 rounded-full"></div>
            </div>
            
            {/* Outer ring animation */}
            <div className="absolute inset-0 rounded-full border-2 border-yellow-300/30 animate-spin-slow"></div>
          </div>
          
          {/* Floating particles */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => {
              const angle = (i / 8) * 2 * Math.PI;
              const radius = 30;
              const x = 20 + Math.cos(angle) * radius;
              const y = 20 + Math.sin(angle) * radius;
              
              return (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-yellow-300/40 rounded-full animate-float"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    animationDelay: `${i * 0.3}s`,
                    animationDuration: `${2 + i * 0.2}s`
                  }}
                ></div>
              );
            })}
          </div>
        </div>
      </div>

      {isDrawing && (
        <div 
          className="text-xs font-bold text-yellow-400 animate-pulse mb-2 px-2 py-1 bg-white/10 rounded-full border border-white/20"
          role="status"
          aria-live="polite"
        >
          ✨ Drawing...
        </div>
      )}

      {/* Recent Numbers Section */}
      <div className="w-full mt-3" aria-label="Recently called numbers">
        <h2 className="text-sm font-bold text-center mb-3 text-gray-300">Recent Numbers</h2>
        <div className="flex justify-center gap-1.5" role="list">
          {recentNumbers.length > 0 ? (
            recentNumbers.map((number) => (
              <div
                key={number}
                className="w-8 h-8 bg-gradient-to-br from-orange-500 to-yellow-500 text-white rounded-lg flex items-center justify-center text-xs font-black shadow-lg transition-transform duration-200 hover:scale-110 border border-purple-400/30"
                role="listitem"
                aria-label={`Recent number: ${number}`}
              >
                {number}
              </div>
            ))
          ) : (
            <div className="text-gray-300 text-xs px-3 py-4 bg-white/5 rounded-lg border border-white/10 text-center">
              🎯 No numbers called yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 