import React, { useState } from 'react';
import { GameState, DisplayState } from '../../types';
import { SoundType } from '../../hooks/useSoundManager';
import { formatGameIdForDisplay } from '../../lib/utils';

interface GameInfoCardsProps {
  gameState: GameState;
  displayState: DisplayState;
  soundType: SoundType;
  onSoundTypeChange: (type: SoundType) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isDrawingActive?: boolean;
  className?: string;
}

export function GameInfoCards({ 
  gameState, 
  displayState, 
  soundType,
  onSoundTypeChange,
  isMuted,
  onToggleMute,
  isDrawingActive,
  className = '' 
}: GameInfoCardsProps) {
  const { isConnected } = displayState;
  const { gameId, gameStatus, calledNumbers, cartelas } = gameState;
  const [showSoundCard, setShowSoundCard] = useState(false);

  const calculateProgress = (numbers: number[]) => {
    return Math.round((numbers.length / 75) * 100);
  };

  const formatCurrency = (amount: number) => `Br. ${amount.toFixed(2)}`;

  return (
    <div className={`flex items-center justify-between w-full gap-3 ${className}`}>

      {/* Game ID Card */}
      <div className="bg-gradient-to-br bg-black rounded-3xl p-3 border border-gray-600/50 shadow-xl flex-1 h-24 flex flex-col justify-center">
        <div className="text-xs text-gray-300 uppercase tracking-wider font-bold text-center mb-2 opacity-80">GAME ID</div>
        <div className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 text-center">
          {formatGameIdForDisplay(gameId)}
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-gradient-to-br bg-black rounded-3xl p-3 border border-gray-600/50 shadow-xl flex-1 h-24 flex flex-col justify-center">
        <div className="text-xs text-gray-300 uppercase tracking-wider font-bold text-center mb-2 opacity-80">STATUS</div>
        <div className={`text-lg font-black text-center ${
          gameStatus === 'active' ? 'text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500' :
          gameStatus === 'finished' ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500' : 
          'text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500'
        }`}>
          {gameStatus || 'waiting'}
        </div>
      </div>



      {/* Cartela Selected Card */}
      <div className="bg-gradient-to-br bg-black rounded-3xl p-3 border border-gray-600/50 shadow-xl flex-1 h-24 flex flex-col justify-center">
        <div className="text-xs text-gray-300 uppercase tracking-wider font-bold text-center mb-2 opacity-80">CARTELA</div>
        <div className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 text-center">
          {cartelas || 0}
        </div>
      </div>
      {/* Individual Stake Card */}
      <div className="bg-gradient-to-br bg-black rounded-3xl p-3 border border-gray-600/50 shadow-xl flex-1 h-24 flex flex-col justify-center">
        <div className="text-xs text-gray-300 uppercase tracking-wider font-bold text-center mb-2 opacity-80">STACK</div>
        <div className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 text-center">
          {gameState.stack ? `Br. ${gameState.stack}` : 'Br. 0'}
        </div>
      </div>

      {/* Total Win Card */}
      <div className="bg-gradient-to-br bg-black rounded-3xl p-3 border border-gray-600/50 shadow-xl flex-1 h-24 flex flex-col justify-center">
        <div className="text-xs text-gray-300 uppercase tracking-wider font-bold text-center mb-2 opacity-80">TOTAL TO WIN</div>
        <div className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 text-center">
          {formatCurrency(gameState.netPrizePool || 0)}
        </div>
      </div>



      {/* Progress Card */}
      <div className="bg-gradient-to-br px-15 bg-black rounded-3xl p-3 border border-gray-600/50 shadow-xl flex-1 h-24 flex flex-col justify-center">
        <div className="text-xs text-gray-300 uppercase tracking-wider font-bold text-center mb-2 opacity-80">PROGRESS</div>
        <div className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 text-center">
          {calledNumbers?.length || 0}/75
        </div>
        <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden mt-2">
          <div 
            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700 ease-out shadow-lg"
            style={{ width: `${calculateProgress(calledNumbers || [])}%` }}
          ></div>
        </div>
      </div>

      {/* Sound Selection Card - Expandable with Connection Indicator */}
      <div className="relative">
        {showSoundCard ? (
          <div className="bg-gradient-to-br bg-black rounded-3xl p-3 border border-gray-600/50 shadow-xl w-32 h-24 flex flex-col justify-center">
            <div className="text-xs text-gray-300 uppercase tracking-wider font-bold text-center mb-2 opacity-80">SOUND</div>
            <div className="flex justify-center gap-1.5 mb-2">
              {(['AM', 'OR', 'TG'] as SoundType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => onSoundTypeChange(type)}
                  className={`text-xs px-2.5 py-1.5 rounded-xl font-bold transition-all duration-300 ${
                    soundType === type 
                      ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg scale-105' 
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {/* Mute Button */}
            <button
              onClick={onToggleMute}
              className={`w-full text-xs px-2 py-1 rounded-lg font-bold transition-all duration-300 ${
                isMuted
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-gray-200'
              }`}
            >
              {isMuted ? '🔇 MUTE' : '🔊 MUTE'}
            </button>
            
            {/* Drawing Mode Indicator */}
            {isDrawingActive && (
              <div className="mt-2 text-center">
                <div className="text-xs text-green-400 font-bold animate-pulse">
                  🎵 AUTO SOUND
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => setShowSoundCard(true)}
              className="bg-gradient-to-br from-gray-700/80 to-gray-800/80 backdrop-blur-md rounded-full p-2 border border-gray-600/50 shadow-lg hover:scale-105 transition-all duration-300"
            >
              <div className="text-xs font-bold text-gray-300">{soundType}</div>
            </button>
            
            {/* Drawing Mode Indicator */}
            {isDrawingActive && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm"></div>
            )}
            
            {/* Connection Indicator below sound button */}
            <div className={`w-2 h-2 rounded-full shadow-sm ${
              isConnected 
                ? 'bg-green-400 animate-pulse' 
                : 'bg-red-400'
            }`}></div>
          </div>
        )}
        
        {/* Close button when expanded */}
        {showSoundCard && (
          <button
            onClick={() => setShowSoundCard(false)}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition-colors"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
} 