import React from 'react';

interface WinnerAnnouncementProps {
  winStack: number;
  isGameActive: boolean;
  className?: string;
}

export function WinnerAnnouncement({ winStack, isGameActive, className = '' }: WinnerAnnouncementProps) {
  const formatCurrency = (amount: number) => `Br. ${amount.toFixed(2)}`;
  
  return (
    <div className={`bg-gradient-to-br from-amber-500/20 via-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl p-6 border border-amber-400/30 shadow-2xl ${className}`}>
      {/* Header with Amharic Text */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-amber-300 mb-2">
          🏆 አሸናፊው ያገኛል 🏆
        </h2>
        <p className="text-amber-200 text-sm">
          Winner Gets This Amount
        </p>
      </div>

      {/* Win Stack Display */}
      <div className="relative">
        {/* Glowing Background Circle */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
        
        {/* Main Win Stack Circle */}
        <div className="relative bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-full p-8 text-center shadow-2xl border-4 border-green-300/50">
          {/* Currency Icon */}
          <div className="text-6xl mb-3">💰</div>
          
          {/* Amount Display */}
          <div className="text-3xl font-bold text-white mb-2">
            {formatCurrency(winStack)}
          </div>
          
          {/* Amharic Label */}
          <div className="text-green-100 text-lg font-semibold">
            የማሸነፊያ መጠን
          </div>
        </div>
      </div>

      {/* Game Status Indicator */}
      <div className="mt-6 text-center">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
          isGameActive 
            ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
            : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isGameActive ? 'bg-green-400 animate-pulse' : 'bg-amber-400'
          }`}></div>
          <span className="text-sm font-medium">
            {isGameActive ? '🎮 ጨዋታ እያለ' : '⏳ ጨዋታ እያስተጋባለል'}
          </span>
        </div>
      </div>

      {/* Motivational Message */}
      <div className="mt-4 text-center">
        <p className="text-amber-200/80 text-sm italic">
          {isGameActive 
            ? '🎯 አሸንፈው ይህን ያግኙ!' 
            : '🚀 ጨዋታውን ጀምሩ እና ያሸንፉ!'
          }
        </p>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-4 right-4 text-amber-400/30 text-2xl">✨</div>
      <div className="absolute bottom-4 left-4 text-amber-400/30 text-2xl">💎</div>
      <div className="absolute top-1/2 left-2 text-amber-400/20 text-xl">🌟</div>
      <div className="absolute top-1/2 right-2 text-amber-400/20 text-xl">💫</div>
    </div>
  );
}
