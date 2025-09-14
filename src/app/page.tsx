"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useSoundManager } from '../hooks/useSoundManager';
import { BingoBoard } from '../components/bingo/BingoBoard';
import { CurrentNumberDisplay } from '../components/bingo/CurrentNumberDisplay';
import { GameInfoCards } from '../components/layout/GameInfoCards';
import { CompactWinnerNews } from '../components/layout/CompactWinnerNews';
import { VerificationModal } from '../components/bingo/VerificationModal';
import { CartelaDisplay } from '../components/bingo/CartelaDisplay';
import { InteractiveShuffle } from '../components/bingo/InteractiveShuffle';

import { apiClient } from '../utils/api';
import type { DisplayState } from '../types';

export default function DisplayPage() {
  const [displayToken, setDisplayToken] = useState<string | null>(null);
  const [showCartelas, setShowCartelas] = useState(false);
  const [availableCartelas, setAvailableCartelas] = useState<number[]>([]); // Available cartelas 1-210
  const [selectedCartelas, setSelectedCartelas] = useState<number[]>([]); // Selected cartelas
    const [placedBets, setPlacedBets] = useState<Map<number, { cartelaId: number; placedAt: Date; status: string }>>(new Map()); // Track placed bets
  
  // Sound management
  const {
    soundType,
    setSoundType,
    playNumberSound,
    playWinSound,
    isMuted,
    toggleMute,
    isDrawingActive,
    activateDrawingMode,
    deactivateDrawingMode
  } = useSoundManager();
  
  // Ref for Bingo board to target number cells during shuffle
  const bingoBoardRef = useRef<HTMLDivElement>(null);

  // Get display token from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    let session = urlParams.get("s");
    
    if (!session) {
      const bingoParam = urlParams.get("Bingo");
      if (bingoParam) {
        session = bingoParam;
      }
    }
    
    if (!session) {
      const fullUrl = window.location.href;
      const match = fullUrl.match(/[?&]Bingo=([^&]+)/);
      if (match) {
        session = match[1];
      }
    }
    
    setDisplayToken(session);
  }, []);

  // Persist cartela display state in localStorage
  useEffect(() => {
    if (displayToken) {
      const savedState = localStorage.getItem(`cartela_display_${displayToken}`);
      if (savedState) {
        try {
          const { showCartelas: savedShowCartelas, selectedCartelas: savedSelectedCartelas } = JSON.parse(savedState);
          setShowCartelas(savedShowCartelas || false);
          setSelectedCartelas(savedSelectedCartelas || []);
        } catch (error) {
          console.error('Error parsing saved cartela state:', error);
        }
      }
    }
  }, [displayToken]);

  // Save cartela display state to localStorage
  const saveCartelaState = useCallback((show: boolean, cartelas: number[]) => {
    if (displayToken) {
      localStorage.setItem(`cartela_display_${displayToken}`, JSON.stringify({
        showCartelas: show,
        selectedCartelas: cartelas
      }));
    }
  }, [displayToken]);

  // Sync selected cartelas from database when display refreshes
  // This functionality is now handled by real-time socket updates

  // Fetch placed bet cartelas on mount and when display token changes
  useEffect(() => {
    const fetchPlacedBetCartelas = async () => {
      if (displayToken) {
        try {
          const response = await apiClient.getPlacedBetCartelas(displayToken);
          if (response.success && response.data) {
            const placedBetMap = new Map();
            response.data.forEach((cartelaId: number) => {
              placedBetMap.set(cartelaId, {
                cartelaId,
                placedAt: new Date(),
                status: 'active'
              });
            });
            setPlacedBets(placedBetMap);
          }
        } catch (error) {
          console.error('Error fetching placed bet cartelas:', error);
        }
      }
    };

    fetchPlacedBetCartelas();
  }, [displayToken]);



  // Listen for real-time placed bets updates from socket
  useEffect(() => {
    const handlePlacedBetsUpdate = (event: CustomEvent) => {
      const { placedBetCartelas, timestamp } = event.detail;
      
      // Update placed bets state with real-time data
      const placedBetMap = new Map();
      placedBetCartelas.forEach((cartelaId: number) => {
        placedBetMap.set(cartelaId, {
          cartelaId,
          placedAt: new Date(timestamp),
          status: 'active'
        });
      });
      
      setPlacedBets(placedBetMap);
      
      // Also clear selected cartelas when this event is received
      // This ensures the display logic works correctly after clear operations
      setSelectedCartelas([]);
    };

    // Handle real-time cartela clear events for immediate refresh
    const handleCartelasCleared = () => {
      // Immediately clear selected cartelas for instant visual feedback
      setSelectedCartelas([]);
      
      // Force immediate refresh of cartela display
      if (showCartelas) {
        // All cartelas will now show as unselected (gray)
        // Placed bet cartelas will remain visible (green with checkmark)
      }
    };

    // Add event listeners for real-time updates
    window.addEventListener('placed_bets_updated', handlePlacedBetsUpdate as EventListener);
    window.addEventListener('cartelas_cleared', handleCartelasCleared as EventListener);
    
    // Cleanup event listeners
    return () => {
      window.removeEventListener('placed_bets_updated', handlePlacedBetsUpdate as EventListener);
      window.removeEventListener('cartelas_cleared', handleCartelasCleared as EventListener);
    };
  }, [showCartelas]);

  // Sync cartelas from database on mount and when display token changes
  useEffect(() => {
    if (displayToken) {
      // Don't auto-sync from database - wait for real-time data
    }
  }, [displayToken]);

  const { gameState, displayState, setDisplayState, isConnected, verificationData } = useSocket(
    displayToken,
    async (cartelas: number[]) => {
      if (cartelas.length === 0) {
        // Empty array means show all available cartelas (1-210)
        const allCartelas = Array.from({ length: 210 }, (_, i) => i + 1);
        setAvailableCartelas(allCartelas); // Set all cartelas 1-210
        setSelectedCartelas([]); // IMPORTANT: No cartelas selected initially - only real-time selections
        setShowCartelas(true);
        saveCartelaState(true, []);
        
        // Clear any old selections from localStorage
        if (displayToken) {
          localStorage.removeItem(`cartela_display_${displayToken}`);
        }
      } else {
        // Specific cartelas selected by cashier
        setAvailableCartelas(cartelas); // Set the specific cartelas
        setSelectedCartelas(cartelas); // These are the ones actually selected
        
        // Only show cartela display if game status is 'waiting'
        if (gameState.gameStatus === 'waiting') {
          setShowCartelas(true);
          saveCartelaState(true, cartelas);
        } else {
          setShowCartelas(false);
          saveCartelaState(false, []);
        }
      }
    },
    () => { // onCloseCartelas callback
      // Always close cartela display when explicitly requested
      setShowCartelas(false);
      setSelectedCartelas([]);
      setAvailableCartelas([]); // Clear available cartelas
      saveCartelaState(false, []);
    },
    { // sound callbacks
      playNumberSound,
      playWinSound,
      playLostSound: () => {} // Ignored
    }
  );

  // Auto-activate drawing mode when game starts
  useEffect(() => {
    if (gameState.gameStatus === 'active') {
      // Game is active - activate drawing mode for automatic sounds
      activateDrawingMode();
    } else if (gameState.gameStatus === 'waiting' || gameState.gameStatus === 'finished' || gameState.gameStatus === 'completed') {
      // Game is not active - deactivate drawing mode
      deactivateDrawingMode();
    }
  }, [gameState.gameStatus, activateDrawingMode, deactivateDrawingMode]);

  // Auto-activate drawing mode when numbers are being drawn
  useEffect(() => {
    if (gameState.currentNumber && gameState.gameStatus === 'active') {
      // A number is currently being drawn - activate drawing mode
      activateDrawingMode();
    }
  }, [gameState.currentNumber, gameState.gameStatus, activateDrawingMode]);

  // Auto-deactivate drawing mode when game reaches 75/75
  useEffect(() => {
    if (gameState.calledNumbers && gameState.calledNumbers.length >= 75) {
      // Game completed - deactivate drawing mode
      deactivateDrawingMode();
    }
  }, [gameState.calledNumbers, deactivateDrawingMode]);

  // Monitor 3D mixer state changes for debugging
  useEffect(() => {
    // 3D mixer state monitoring
  }, [displayState?.show3DMixer, displayState?.isShuffling]);

  // Sync with gameState.selectedCartelas for real-time updates
  useEffect(() => {
    if (gameState.selectedCartelas) {
      // Always update from gameState to get real-time selections (including empty array)
      setSelectedCartelas(gameState.selectedCartelas);
      
      // Check if we should show cartela display
      const shouldShowCartelas = gameState.selectedCartelas.length > 0 || placedBets.size > 0;
      
      if (shouldShowCartelas) {
        // Auto-show cartela display ONLY when game status is 'waiting' AND we're not in a game transition
        if (gameState.gameStatus === 'waiting') {
          // Only show if we don't have a flag indicating we just started a game
          const justStartedGame = localStorage.getItem(`cartela_display_${displayToken}_just_started`);
          if (!justStartedGame) {
            setShowCartelas(true);
            saveCartelaState(true, gameState.selectedCartelas);
          } else {
            localStorage.removeItem(`cartela_display_${displayToken}_just_started`);
          }
        } else {
          // Don't auto-show for other game statuses (active, paused, completed)
        }
      } else {
        // If no cartelas selected AND no placed bets, close the display
        setShowCartelas(false);
        saveCartelaState(false, []);
      }
    }
  }, [gameState.selectedCartelas, selectedCartelas, gameState.gameStatus, placedBets, saveCartelaState, displayToken]);

  // DEBUG: Log whenever selectedCartelas changes
  useEffect(() => {
    // selectedCartelas state monitoring
  }, [selectedCartelas]);

  // Real-time cartela syncing - handled by useSocket hook
  // The socket hook already handles cartela_selected, cartela_deselected, and close_cartelas events

  // Auto-close cartela display when game becomes active - MODIFIED: Don't auto-close, preserve display
  useEffect(() => {
    if (gameState.gameStatus === 'active' && showCartelas) {
      // Don't close the display - keep it open to show current cartela state
    }
  }, [gameState.gameStatus, showCartelas, saveCartelaState]);

  // Auto-close cartela display when game status changes from 'waiting' to other statuses - MODIFIED: More selective
  useEffect(() => {
    if (gameState.gameStatus !== 'waiting' && showCartelas) {
      // Only close display for certain statuses, not for 'active'
      if (gameState.gameStatus === 'completed' || gameState.gameStatus === 'finished' || gameState.gameStatus === 'cancelled') {
        setShowCartelas(false);
        setSelectedCartelas([]);
        setAvailableCartelas([]);
        saveCartelaState(false, []);
      } else if (gameState.gameStatus === 'active') {
        // Don't close - keep display open for active games
      } else {
        // Don't close for other statuses
      }
    }
  }, [gameState.gameStatus, showCartelas, saveCartelaState]);

  // Clear cartela state when game ends
  useEffect(() => {
    if (gameState.gameStatus === 'waiting' && showCartelas) {
      // Only clear if it was previously active
      const wasActive = localStorage.getItem(`cartela_display_${displayToken}_was_active`);
      if (wasActive === 'true') {
        setShowCartelas(false);
        setSelectedCartelas([]);
        setAvailableCartelas([]); // Clear available cartelas
        saveCartelaState(false, []);
        localStorage.removeItem(`cartela_display_${displayToken}_was_active`);
      }
    } else if (gameState.gameStatus === 'active') {
      localStorage.setItem(`cartela_display_${displayToken}_was_active`, 'true');
    }
  }, [gameState.gameStatus, showCartelas, displayToken, saveCartelaState]);

  // Comprehensive reset function for when game ends
  // const handleComprehensiveReset = useCallback(() => {
  //   console.log('🧹 Performing comprehensive reset on display page');
    
  //   // Clear all cartela-related states
  //   setShowCartelas(false);
  //   setSelectedCartelas([]);
  //   setAvailableCartelas([]);
    
  //   // Clear all localStorage related to cartelas
  //   if (displayToken) {
  //     localStorage.removeItem(`cartela_display_${displayToken}`);
  //     localStorage.removeItem(`cartela_display_${displayToken}_was_active`);
  //   console.log('🧹 Cleared all cartela-related localStorage');
  //   }
    
  //   // Clear verification modal if open
  //   setShowVerification(false);
    
  //   console.log('🧹 Display page completely reset for new game');
  // }, [displayToken]);

  // Listen for comprehensive reset events from the socket
  useEffect(() => {
    if (displayToken) {
      // This will be handled by the useSocket hook's game_comprehensive_reset event
      // which will call onCloseCartelas, which will trigger our reset logic
    }
  }, [displayToken]);



  // Show loading state if no session ID
  if (!displayToken) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          {/* Loading Spinner */}
          <div className="mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          </div>
          
          {/* Loading Dots Animation */}
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while socket is connecting
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          {/* Loading Spinner */}
          <div className="mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto"></div>
          </div>
          
          {/* Loading Dots Animation */}
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while game data is loading
  if (gameState.isLoadingGameData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          {/* Loading Spinner */}
          <div className="mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto"></div>
          </div>
          
          {/* Loading Dots Animation */}
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">

      {/* Main Content */}
      <div className="relative z-10 min-h-screen p-4 lg:p-6 border border-gray-600/50 rounded-3xl shadow-2xl">
        {/* Top Row with Cards */}
        <div className="mb-6 relative">
          <div className="relative flex justify-start items-center">
            <GameInfoCards
              gameState={gameState}
              displayState={displayState}
              soundType={soundType}
              onSoundTypeChange={setSoundType}
              isMuted={isMuted}
              onToggleMute={toggleMute}
              isDrawingActive={isDrawingActive}
              className=" transition-transform duration-300"
            />
          </div>
        </div>

        {/* Main Game Area */}
        <main className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          {/* Bingo Board */}
          <section className="xl:col-span-9 relative ">
            <div className="relative bg-gray-900/20 backdrop-blur-xl rounded-2xl p-2 sm:p-3  shadow-2xl flex items-center justify-center h-80">
              <BingoBoard
                ref={bingoBoardRef}
                calledNumbers={gameState.calledNumbers || []}
                currentNumber={gameState.currentNumber}
                className="transform hover:scale-[1.02] transition-transform duration-500"
              />
            </div>
          </section>

          {/* Right Side Panel */}
          <aside className="xl:col-span-3 flex flex-col gap-5" aria-label="Current number and game information">
            {/* Current Number Display */}
            <section className="relative bg-gray-900/20 backdrop-blur-xl rounded-2xl p-2 lg:p-3  shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 h-80">
              <CurrentNumberDisplay
                gameState={gameState}
                isDrawing={displayState.isDrawing}
              />
            </section>
            

          </aside>
        </main>

        {/* Winner News Announcement */}
        {gameState.gameStatus === 'active' && (
          <div className="fixed right-8 bottom-16 z-50">
            <CompactWinnerNews
              winStack={gameState.totalWinStack || 0}
              isGameActive={gameState.gameStatus === 'active'}
              gameState={gameState}
              className=""
            />
          </div>
        )}
      </div>

      {/* Verification Modal */}
      {displayState.showVerificationModal && (
        <VerificationModal
          isOpen={displayState.showVerificationModal}
          data={verificationData}
        />
      )}

      {/* Cartela Display */}
      <CartelaDisplay 
        cartelas={availableCartelas} // Show all available cartelas 1-210
        isVisible={showCartelas} 
        selectedCartelas={selectedCartelas} // Use local state for selected cartelas
        gameStatus={gameState.gameStatus}
        onClose={() => {
          setShowCartelas(false);
          setSelectedCartelas([]);
          setAvailableCartelas([]); // Clear available cartelas
          saveCartelaState(false, []);
        }}
        placedBets={placedBets}
      />

      {/* Interactive Shuffle Mode */}
      <InteractiveShuffle
        isVisible={displayState.show3DMixer || false}
        onShuffleComplete={() => {
          setDisplayState((prev: DisplayState) => ({
            ...prev,
            show3DMixer: false,
            isShuffling: false
          }));
        }}
        bingoBoardRef={bingoBoardRef}
      />
      
    </div>
  );
}
