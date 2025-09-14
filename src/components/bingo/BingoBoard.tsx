import React, { forwardRef } from 'react';
import { generateBingoColumns, isNumberCalled } from '../../lib/utils';

interface BingoBoardProps {
  calledNumbers: number[];
  currentNumber?: number;
  className?: string;
}

export const BingoBoard = forwardRef<HTMLDivElement, BingoBoardProps>(({ calledNumbers, currentNumber, className = '' }, ref) => {
  const columns = generateBingoColumns();

  return (
    <div 
      ref={ref}
      className={`flex flex-col gap-1 ${className}`} 
      role="grid" 
      aria-label="BINGO number board with 75 numbers organized by letters B-I-N-G-O"
    >
      {columns.map((column) => (
        <div key={column.letter} className="flex items-center gap-6" role="row">
          {/* Letter Circle */}
          <div className="relative flex-shrink-0" role="rowheader">
            <div 
              className="w-13 h-13 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-xl border-2 border-white-300/60 transition-transform duration-300 hover:scale-105"
              aria-label={`BINGO letter ${column.letter}`}
            >
              {column.letter}
            </div>
          </div>
          
          {/* Numbers Row */}
          <div className="flex gap-1.5" role="group" aria-label={`Numbers for letter ${column.letter}`}>
            {column.numbers.map((num) => {
              const isCalled = isNumberCalled(num, calledNumbers);
              const isCurrentNumber = currentNumber === num;
              
              return (
                <div
                  key={num}
                  className={`bingo-number flex-shrink-0 w-13 h-13 flex items-center justify-center text-base font-black transition-all duration-300 hover:scale-105 shadow-lg ${
                    isCurrentNumber
                      ? 'text-black border-2 border-yellow-300/60 scale-105 rounded-lg animate-keno-shine shadow-2xl'
                      : isCalled
                      ? 'bg-gradient-to-br from-yellow-400 via-yellow-600 to-orange-500 text-black shadow-xl shadow-yellow-500/20 border-2 border-yellow-300/60 scale-105 rounded-lg'
                      : 'bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white hover:from-red-400 hover:via-red-500 hover:to-red-600 shadow-lg shadow-red-500/10 border-2 border-red-400/40 rounded-lg'
                  }`}
                  role="gridcell"
                  aria-label={`Number ${num} in column ${column.letter}${isCurrentNumber ? ', current number' : isCalled ? ', called' : ', not called'}`}
                  tabIndex={0}
                >
                  {isCurrentNumber ? (
                    <div className="flex flex-col items-center">
                      <span className="drop-shadow-sm font-bold text-white text-xs -mt-1">{column.letter}</span>
                      <span className="drop-shadow-sm font-bold text-black text-lg">{num}</span>
                    </div>
                  ) : (
                    <span className="drop-shadow-sm font-bold">{num}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
});

BingoBoard.displayName = 'BingoBoard';