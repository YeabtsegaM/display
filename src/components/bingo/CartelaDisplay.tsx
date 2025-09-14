'use client';

import React, { useState, useEffect } from 'react';

interface CartelaDisplayProps {
  cartelas: number[];
  isVisible: boolean;
  className?: string;
  selectedCartelas?: number[]; // Cartelas that are selected/reserved
  gameStatus?: 'waiting' | 'active' | 'paused' | 'completed' | 'finished' | 'cancelled';
  onClose?: () => void;
  placedBets?: Map<number, { cartelaId: number; placedAt: Date; status: string }>; // Add placed bets data
}

export function CartelaDisplay({ 
  cartelas, 
  isVisible, 
  className = '', 
  selectedCartelas = [],
  gameStatus = 'waiting',
  // onClose,
  placedBets = new Map()
}: CartelaDisplayProps) {
  const [isClearing, setIsClearing] = useState(false);

  // Add effect to show brief flash when cartelas are cleared
  useEffect(() => {
    if (selectedCartelas.length === 0 && cartelas.length > 0) {
      // Show brief flash effect when cartelas are cleared
      setIsClearing(true);
      const timer = setTimeout(() => setIsClearing(false), 500);
      return () => clearTimeout(timer);
    }
  }, [selectedCartelas.length, cartelas.length]);

  if (!isVisible) {
    return null;
  }

  // Generate cartela numbers 1-210 if none provided
  const displayCartelas = cartelas.length > 0 ? cartelas : Array.from({ length: 210 }, (_, i) => i + 1);
  
  // Get cartelas with placed bets from the placedBets Map
  const cartelasWithPlacedBets = Array.from(placedBets.keys());
  
  // Combine selected cartelas and placed bet cartelas for display
  const allDisplayCartelas = [...new Set([...displayCartelas, ...cartelasWithPlacedBets])];

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-dark-900/90 backdrop-blur-xl rounded-3xl p-8 w-full mx-4 overflow-hidden relative">
        <div className="flex justify-between items-center space-x-4">
            <div className="text-white text-2xl font-bold m-4">Cartelas</div>
        </div>

        {/* Cartela Grid - Fixed Layout */}
        <div 
          className={`max-h-[100vh] overflow-y-auto p-4 bg-gray-800/50 rounded-2xl transition-all duration-300 ${
            isClearing ? 'bg-blue-500/20 ring-2 ring-blue-400/50' : ''
          }`}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(21, 1fr)',
            gap: '8px'
          }}
        >
          {allDisplayCartelas.map((cartelaId) => {
            const isSelected = selectedCartelas.includes(cartelaId);
            const hasPlacedBet = placedBets.has(cartelaId);
            
            let buttonClass = '';
            let buttonText = cartelaId.toString();
            let title = `Cartela ${cartelaId}`;
            
            if (hasPlacedBet && isSelected) {
              // Cartela with placed bet that is also selected - green with checkmark
              buttonClass = 'bg-gradient-to-br from-green-500 via-green-600 to-green-700 border-green-400/60 cursor-not-allowed opacity-90';
              buttonText = `${cartelaId} ✓`;
              title = `Cartela ${cartelaId} - Selected with placed bet`;
            } else if (hasPlacedBet) {
              // Cartela with placed bet but not selected - green with checkmark
              buttonClass = 'bg-gradient-to-br from-green-500 via-green-600 to-green-700 border-green-400/60 cursor-not-allowed opacity-90';
              buttonText = `${cartelaId} ✓`;
              title = `Cartela ${cartelaId} - Bet already placed`;
            } else if (isSelected) {
              // Selected cartela - green color
              buttonClass = 'bg-gradient-to-br from-green-500 via-green-600 to-green-700 border-green-400/60 cursor-not-allowed opacity-90';
              title = `Cartela ${cartelaId} - Already Selected`;
            } else {
              // Available cartela - gray color
              buttonClass = 'bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 border-gray-300/60 cursor-pointer hover:scale-105 hover:shadow-xl';
              title = `Cartela ${cartelaId} - Available`;
            }
            
            return (
              <div
                key={cartelaId}
                className={`w-13 h-13 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 transition-all duration-300 relative ${buttonClass}`}
                title={title}
                onClick={() => {
                  // Only allow interaction if game is active or waiting
                  if (gameStatus === 'active' || gameStatus === 'waiting') {
                    // Handle cartela selection logic here if needed
                    console.log(`Cartela ${cartelaId} clicked - Game status: ${gameStatus}`);
                  }
                }}
              >
                {buttonText}
                {isSelected && !hasPlacedBet && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
