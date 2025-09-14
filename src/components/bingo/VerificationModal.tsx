import React from 'react';
import { isPositionInWinningPattern } from '../../lib/utils';
import type { VerificationData } from '../../types';

interface VerificationModalProps {
  isOpen: boolean;
  data: VerificationData | null;
  onClose?: () => void;
}

export function VerificationModal({ isOpen, data, onClose }: VerificationModalProps) {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-3xl p-4 sm:p-6 md:p-8 border-4 border-yellow-300/60 shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-300/20 to-orange-400/20 animate-pulse"></div>
        <div className="absolute top-4 right-4 w-16 h-16 bg-white/20 rounded-full blur-xl animate-ping"></div>
        <div className="absolute bottom-4 left-4 w-12 h-12 bg-white/20 rounded-full blur-lg animate-pulse"></div>

        <div className="relative z-10">
          {/* Close Button */}
          <button
            onClick={onClose || (() => window.location.reload())}
            className="absolute top-0 right-0 w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg z-20"
            aria-label="Close verification modal"
          >
            ✕
          </button>
          
          {/* Header */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 drop-shadow-lg">
              {data.status === 'won' ? '🎉 WINNER! 🎉' : 
               data.status === 'lost' ? '❌ NO WIN' : 
               data.status === 'locked' ? '🔒 LOCKED' : '🔍 VERIFICATION'}
            </div>
            
            {/* Show original status if this is a locked cartela */}
            {data.isLocked && data.originalStatus && (
              <div className="text-lg text-blue-200 font-semibold mb-2">
                {data.originalStatus === 'won' ? '🏆 Originally Won' : '❌ Originally Lost'}
              </div>
            )}
            
            <div className="text-base sm:text-lg font-bold text-white/90">
              Ticket: {data.ticketNumber}
            </div>
            
            <div className="text-xs sm:text-sm text-white/80">
              Cartela ID: {data.cartelaId} | Game: {data.gameId}
            </div>
            
            {/* Show locked message */}
            {data.isLocked && (
              <div className="text-sm text-yellow-200 font-semibold mt-2">
                🔒 This cartela has already been verified for this game
              </div>
            )}
            
            {data.winningPatternDetails && data.winningPatternDetails.length > 0 && data.status !== 'locked' && (
              <div className="text-sm text-green-200 font-semibold mt-2">
                🏆 Win Patterns: {data.winningPatternDetails.map(pattern => pattern.patternName).join(', ')}
              </div>
            )}
            
            <div className="text-xs text-white/70 mt-2">
              Progress: {data.gameProgress}/75 | Called: {data.totalCalledNumbers}
            </div>
          </div>

          {/* BINGO Grid Display */}
          {data.cartelaGrid && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 relative">
              {/* Locked indicator overlay */}
              {data.isLocked && (
                <div className="absolute top-2 right-2 z-10 bg-yellow-500 text-white p-1 rounded-full shadow-lg">
                  🔒
                </div>
              )}
              
              <div className="max-w-xs mx-auto">
                {/* BINGO Column Headers */}
                <div className="grid grid-cols-5 gap-1 mb-2">
                  {['B', 'I', 'N', 'G', 'O'].map((letter) => (
                    <div
                      key={letter}
                      className="w-8 h-8 flex items-center justify-center text-white font-bold text-sm"
                    >
                      {letter}
                    </div>
                  ))}
                </div>
                
                {/* BINGO Grid */}
                <div className="grid grid-cols-5 gap-1">
                  {data.cartelaGrid.map((row, rowIndex) => (
                    row.map((num, colIndex) => {
                      const isMatched = data.matchedNumbers.includes(num);
                      // Check if this number has been drawn in the current game
                      const isDrawn = data.drawnNumbers && data.drawnNumbers.includes(num);
                      
                      // Check if this position is part of a winning pattern
                      const isWinningPattern = isPositionInWinningPattern(
                        rowIndex, 
                        colIndex, 
                        data.winningPatternDetails?.[0] // Use first pattern for highlighting (or could highlight all)
                      );
                      
                      return (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className={`w-12 h-12 flex items-center justify-center text-lg font-bold rounded-lg border-2 transition-all duration-300 shadow-md ${
                            data.isLocked
                              ? isWinningPattern
                                ? 'bg-gradient-to-br from-green-500 to-green-600 text-white border-green-400/60 shadow-green-500/50' // Original won status
                                : isMatched
                                ? 'bg-gradient-to-br from-green-400 to-green-500 text-white border-green-400/60' // Matched numbers with locked border
                                : 'bg-white text-black border-yellow-400/60' // Unmatched numbers with locked border
                              : isWinningPattern
                              ? 'bg-gradient-to-br from-green-500 to-green-600 text-white border-green-400/60 shadow-green-500/50' // Winning pattern
                              : isMatched
                              ? 'bg-gradient-to-br from-green-400 to-green-500 text-white border-green-400/60' // Matched numbers - GREEN
                              : isDrawn
                              ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-white border-gray-400/60' // Drawn numbers - GRAY
                              : 'bg-white text-black border-gray-300/60' // Normal numbers - WHITE
                          }`}
                        >
                          {num === 0 ? '★' : num}
                        </div>
                      );
                    })
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 