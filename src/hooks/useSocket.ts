import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG, SOCKET_EVENTS, ERROR_MESSAGES } from '../lib/constants';
import { formatGameIdForDisplay } from '../lib/utils';
import type { GameState, DisplayState, VerificationData } from '../types';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
  isLoading: boolean;
  gameState: GameState;
  displayState: DisplayState;
  verificationData: VerificationData | null;
  setDisplayState: React.Dispatch<React.SetStateAction<DisplayState>>;
  setVerificationData: React.Dispatch<React.SetStateAction<VerificationData | null>>;
  onShowCartelas?: (cartelas: number[], cashierId?: string) => void;
  onCloseCartelas?: () => void;
}

interface SoundCallbacks {
  playNumberSound: (number: number) => void;
  playWinSound: () => void;
  playLostSound: () => void;
}

export function useSocket(
  displayToken: string | null, 
  onShowCartelas?: (cartelas: number[], cashierId?: string) => void,
  onCloseCartelas?: () => void,
  soundCallbacks?: SoundCallbacks
): UseSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [gameState, setGameState] = useState<GameState>({
    calledNumbers: [],
    gameStatus: 'waiting',
    gameId: undefined, // Explicitly set to undefined initially
    cartelas: 0,
    stack: 0, // Add individual stake amount
    totalStack: 0,
    totalWinStack: 0,
    // New financial breakdown fields
    totalShopMargin: 0,
    totalSystemFee: 0,
    netPrizePool: 0,
    netShopProfit: 0, // Add net shop profit
    selectedCartelas: [], // Initialize empty array for cartela selections

    gameHistory: [],
    top3Winners: [],
    isLoadingGameData: false
  });
  
  const [displayState, setDisplayState] = useState<DisplayState>({
    isConnected: false,
    connectionError: null,
    isLoading: true,
    selectedLanguage: 'AM',
    isFullScreen: false,
    showGameHistory: false,
    showTop3Winners: false,
    showVerificationModal: false,
    modalPersistent: false,
    isDrawing: false,
    show3DMixer: false,
    isShuffling: false,
  });
  
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const prevGameIdRef = useRef<string | undefined>(undefined);
  
  // Use refs to store callbacks to avoid infinite loops
  const onShowCartelasRef = useRef(onShowCartelas);
  const onCloseCartelasRef = useRef(onCloseCartelas);
  const soundCallbacksRef = useRef(soundCallbacks);
  
  // Update refs when callbacks change
  useEffect(() => {
    onShowCartelasRef.current = onShowCartelas;
    onCloseCartelasRef.current = onCloseCartelas;
    soundCallbacksRef.current = soundCallbacks;
  }, [onShowCartelas, onCloseCartelas, soundCallbacks]);

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    console.log('🔌 Initializing socket connection...');
    console.log('🔌 displayToken in initializeSocket:', displayToken);
    console.log('🔌 displayToken type in initializeSocket:', typeof displayToken);
    console.log('🔌 displayToken length in initializeSocket:', displayToken?.length);
    
    if (!displayToken) {
      console.error('❌ No display token provided');
      setConnectionError(ERROR_MESSAGES.NO_TOKEN);
      setIsConnected(false);
      setIsLoading(false);
      return null;
    }

    try {
      console.log('🔌 Creating socket connection to:', API_CONFIG.SOCKET_URL);
      const socketInstance = io(API_CONFIG.SOCKET_URL, {
        query: { 
          displayToken,
          s: displayToken, // Also send as session ID
          type: 'display'
        },
        timeout: API_CONFIG.SOCKET_TIMEOUT,
        reconnection: true,
        reconnectionAttempts: API_CONFIG.RECONNECTION_ATTEMPTS,
        reconnectionDelay: API_CONFIG.RECONNECTION_DELAY,
      });

      console.log('🔌 Socket instance created successfully');
      return socketInstance;
    } catch (error) {
      console.error('❌ Failed to initialize socket connection:', error);
      setConnectionError(ERROR_MESSAGES.INITIALIZATION_FAILED);
      setIsLoading(false);
      return null;
    }
  }, [displayToken]); // Add displayToken as dependency

  // Setup socket event listeners
  const setupSocketListeners = useCallback((socketInstance: Socket, token: string) => {
    console.log('🔌 Setting up socket event listeners...');
    
    // Connection events
    socketInstance.on(SOCKET_EVENTS.CONNECT, () => {
      console.log('🔌 Socket connected successfully');
      setIsConnected(true);
      setConnectionError(null);
      setIsLoading(false);
      setDisplayState(prev => ({ ...prev, isConnected: true, connectionError: null, isLoading: false }));
      
      // Emit display connected event to notify cashier
      if (token) {
        console.log('🔌 Emitting display:connected with token:', token);
        socketInstance.emit('display:connected', { token: token });
        
        // Join the specific display room for this session
        console.log('🔌 Emitting join_display_room with sessionId:', token);
        socketInstance.emit('join_display_room', { sessionId: token });
        console.log('🔗 Joining display room:', token);

        // Request current connection status
        setTimeout(() => {
          console.log('🔌 Requesting current connection status...');
          socketInstance.emit('get_display_status', { sessionId: token });
        }, 500); // Wait a bit for the connection to stabilize
      }
    });

    // Add new event listeners for better connection status
    socketInstance.on('display:waiting_for_cashier', () => {
      console.log('⏳ Display waiting for cashier...');
      setDisplayState(prev => ({ ...prev, connectionError: 'Waiting for cashier to connect...' }));
    });

    socketInstance.on('display:waiting_for_game', () => {
      console.log('⏳ Display waiting for game...');
      setDisplayState(prev => ({ ...prev, connectionError: 'Waiting for game to start...' }));
    });

    socketInstance.on('cashier:joined', () => {
      console.log('👤 Cashier joined the game');
      setDisplayState(prev => ({ ...prev, connectionError: null }));
    });

    socketInstance.on('display:room_joined', (data: { sessionId: string }) => {
      console.log('🔗 Successfully joined display room:', data.sessionId);
      setDisplayState(prev => ({ ...prev, connectionError: null }));
    });

    socketInstance.on('display:error', (data: { message: string }) => {
      console.error('❌ Display error:', data.message);
      setConnectionError(data.message);
    });

    console.log('🔌 Basic event listeners set up successfully');

    // Handle game cleared event
    socketInstance.on('game_cleared', (data) => {
      // Clear the display when game ends
      setDisplayState(prev => ({ 
        ...prev, 
        gameId: data.gameId || null, // Use new game ID if provided
        status: 'waiting', 
        progress: '0/75',
        cartelas: 0,
        winStack: 'Br. 0',
        connectionError: 'Game ended and cleared'
      }));
      
      // Also update gameState with new game ID
      setGameState(prev => ({
        ...prev,
        gameId: data.gameId || undefined, // Use new game ID if provided
        gameStatus: 'waiting' as const
      }));
    });

    // REMOVED: Conflicting game_reset handler - using the comprehensive one below

    // Listen for game reset event (when cashier resets game for new round)
    socketInstance.on('game_reset', (data: {
      gameId: string; // Changed from newGameId to match backend
      status: string;
      calledNumbers: number[];
      currentNumber: number | undefined;
      progress: number;
      cartelas: number;
      totalStack: number;
      totalWinStack: number;
      timestamp: Date;
    }) => {
      console.log('🔄 Game reset event received:', data);
      
      // CRITICAL FIX: Clear ALL game state for fresh start
      setGameState(prev => ({
        ...prev,
        gameId: data.gameId,
        gameStatus: 'waiting' as const,
        calledNumbers: [], // Clear called numbers
        currentNumber: undefined, // Clear current number
        currentColumn: undefined, // Clear current column
        progress: 0, // Reset progress
        cartelas: 0, // Reset cartelas count
        totalStack: 0, // Reset total stack
        totalWinStack: 0, // Reset total win stack
        totalShopMargin: 0, // Reset shop margin
        totalSystemFee: 0, // Reset system fee
        netPrizePool: 0, // Reset prize pool
        eventId: undefined, // Clear event ID
        gameHistory: [], // Clear game history
        top3Winners: [], // Clear winners
        isLoadingGameData: false // Reset loading state
      }));
      
      // Clear any winner announcements or completed game states
      setDisplayState(prev => ({
        ...prev,
        showWinner: false,
        winnerData: null
      }));
      
      console.log('✅ Display state completely cleared for new game');
    });

    // Handle real-time placed bets updates
    socketInstance.on('placed_bets_updated', (data) => {
      console.log('🎯 Real-time placed bets update received:', data);
      const { placedBetCartelas, gameId, timestamp } = data;
      
      // IMPORTANT: Update the game state with the new betting data
      setGameState(prev => {
        const newState = {
          ...prev,
          // Update betting data from the placed bets update
          cartelas: placedBetCartelas.length || prev.cartelas,
          // Note: totalStack and totalWinStack should come from game_data_updated events
        };
        
        console.log(`🎯 Updated game state from placed bets update:`, {
          cartelas: newState.cartelas,
          previousCartelas: prev.cartelas,
          placedBetCartelas: placedBetCartelas
        });
        
        return newState;
      });
      
      // Emit a custom event that the display page can listen to
      const customEvent = new CustomEvent('placed_bets_updated', {
        detail: {
          type: 'placed_bets_updated',
          placedBetCartelas,
          gameId,
          timestamp
        }
      });
      window.dispatchEvent(customEvent);
      
      console.log(`📊 Socket: Emitted placed_bets_updated event with ${placedBetCartelas.length} cartelas`);
    });

    // Handle new betting events
    socketInstance.on('bets_placed', (data) => {
      console.log('💰 New bets placed:', data);
      const { gameData } = data;
      
      // Update game state with new betting information in real-time
      setGameState(prev => {
        const newState = {
          ...prev,
          cartelas: gameData?.cartelas || prev.cartelas,
          stack: gameData?.stack || prev.stack, // Add individual stake amount
          totalStack: gameData?.totalStack || prev.totalStack,
          totalWinStack: gameData?.totalWinStack || prev.totalWinStack,
          // New financial breakdown fields
          totalShopMargin: gameData?.totalShopMargin || prev.totalShopMargin,
          totalSystemFee: gameData?.totalSystemFee || prev.totalSystemFee,
          netPrizePool: gameData?.netPrizePool || prev.netPrizePool,
          netShopProfit: gameData?.netShopProfit || prev.netShopProfit, // Add net shop profit
          // Also update other game data fields if available
          gameStatus: gameData?.status || prev.gameStatus,
          calledNumbers: gameData?.calledNumbers || prev.calledNumbers,
          currentNumber: gameData?.currentNumber || prev.currentNumber,
          currentColumn: gameData?.currentNumber ? getColumnForNumber(gameData.currentNumber) : prev.currentColumn
        };
        
        console.log(`💰 Updated game state with new bets:`, {
          cartelas: newState.cartelas,
          totalStack: newState.totalStack,
          totalWinStack: newState.totalWinStack,
          totalShopMargin: newState.totalShopMargin,
          totalSystemFee: newState.totalSystemFee,
          netPrizePool: newState.netPrizePool
        });
        
        console.log(`💰 Previous betting data:`, {
          cartelas: prev.cartelas,
          totalStack: prev.totalStack,
          totalWinStack: prev.totalWinStack,
          totalShopMargin: prev.totalShopMargin,
          totalSystemFee: prev.totalSystemFee,
          netPrizePool: prev.netPrizePool
        });
        
        console.log(`💰 New betting data:`, {
          cartelas: newState.cartelas,
          totalStack: newState.totalStack,
          totalWinStack: newState.totalWinStack,
          totalShopMargin: newState.totalShopMargin,
          totalSystemFee: newState.totalSystemFee,
          netPrizePool: newState.netPrizePool
        });
        
        return newState;
      });
    });

    // Handle real-time game data updates (including after bet placement)
    socketInstance.on('game_data_updated', (data) => {
      console.log('🔄 Real-time game data update received:', data);
      if (data?.id) {
        setGameState(prev => {
          const newState = {
            ...prev,
            gameId: data.id,
            gameStatus: data.status || prev.gameStatus,
            cartelas: data.gameData?.cartelas || prev.cartelas,
            totalStack: data.gameData?.totalStack || prev.totalStack,
            totalWinStack: data.gameData?.totalWinStack || prev.totalWinStack,
            // New financial breakdown fields
            totalShopMargin: data.gameData?.totalShopMargin || prev.totalShopMargin,
            totalSystemFee: data.gameData?.totalSystemFee || prev.totalSystemFee,
            netPrizePool: data.gameData?.netPrizePool || prev.netPrizePool,
            netShopProfit: data.gameData?.netShopProfit || prev.netShopProfit,
            calledNumbers: data.gameData?.calledNumbers || prev.calledNumbers,
            currentNumber: data.gameData?.currentNumber || prev.currentNumber,
            currentColumn: data.gameData?.currentNumber ? getColumnForNumber(data.gameData.currentNumber) : prev.currentColumn
          };
          
          console.log(`🔄 Updated game state with real-time data:`, {
            gameId: newState.gameId,
            gameStatus: newState.gameStatus,
            cartelas: newState.cartelas,
            totalStack: newState.totalStack,
            totalWinStack: newState.totalWinStack,
            totalShopMargin: newState.totalShopMargin,
            totalSystemFee: newState.totalSystemFee,
            netPrizePool: newState.netPrizePool,
            netShopProfit: newState.netShopProfit
          });
          
          return newState;
        });

        // Also emit a custom event to update placedBets in the main component
        if (data.gameData?.placedBetCartelas) {
          console.log('🔄 Updating placedBets with new data:', data.gameData.placedBetCartelas);
          const placedBetMap = new Map();
          data.gameData.placedBetCartelas.forEach((cartelaId: number) => {
            placedBetMap.set(cartelaId, {
              cartelaId,
              placedAt: new Date(),
              status: 'active'
            });
          });
          
          // Emit custom event to update placedBets in main component
          const event = new CustomEvent('placed_bets_updated', { 
            detail: { placedBetCartelas: Array.from(placedBetMap.keys()) }
          });
          window.dispatchEvent(event);
        }
      }
    });

    // Handle game status updates specifically
    socketInstance.on('game_status_updated', (data) => {
      console.log('🎮 Game status update received:', data);
      if (data?.status) {
        setGameState(prev => {
          const newState = {
            ...prev,
            gameStatus: data.status,
            gameId: data.gameId || prev.gameId
          };
          
          console.log(`🎮 Game status updated from ${prev.gameStatus} to ${data.status}`);
          console.log(`🎮 New game state:`, newState);
          
          return newState;
        });
      }
    });

    // Handle comprehensive game reset event
    socketInstance.on('game_comprehensive_reset', (data) => {
      console.log('🧹 Comprehensive game reset received on display:', data);
      console.log('🧹 New game ID assigned:', data.newGameId);
      console.log('🧹 Current gameState before comprehensive reset:', gameState);
      
      // Complete reset of all game states
      setGameState(prev => {
        console.log('🧹 Updating gameState with new game ID:', data.newGameId);
        return {
          ...prev,
          gameId: data.newGameId || undefined, // Use new game ID if provided
          gameStatus: 'waiting' as const,
          calledNumbers: [],
          currentNumber: undefined,
          currentColumn: undefined,
          // IMPORTANT: Don't clear betting data on comprehensive reset - it should be preserved
          // cartelas: 0,        // Keep existing betting data
          // totalStack: 0,      // Keep existing betting data  
          // totalWinStack: 0,   // Keep existing betting data
          eventId: undefined,
          gameHistory: [],
          top3Winners: [],
          isLoadingGameData: false,
          sessionId: undefined,
          selectedCartelas: [] // Clear selected cartelas
        };
      });
      
      console.log('🧹 Display states completely reset for new game');
      console.log('🧹 New game ID ready:', data.newGameId);
      
      // Auto-close cartela display when comprehensive reset occurs
      if (onCloseCartelasRef.current) {
        onCloseCartelasRef.current();
      }
      
      // Force page refresh to show new game ID and clean state
      if (data.newGameId) {
        console.log('🧹 Force refreshing page to show new game ID:', data.newGameId);
        setTimeout(() => {
          window.location.reload();
        }, 1000); // Refresh after 1 second for better UX
      }
    });

    socketInstance.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log('Disconnected from BINGO server');
      setIsConnected(false);
      setConnectionError(ERROR_MESSAGES.CONNECTION_LOST);
      setDisplayState(prev => ({ ...prev, isConnected: false, connectionError: ERROR_MESSAGES.CONNECTION_LOST }));
    });

    socketInstance.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
      setConnectionError(ERROR_MESSAGES.CONNECTION_FAILED);
      setIsLoading(false);
      setDisplayState(prev => ({ ...prev, isConnected: false, connectionError: ERROR_MESSAGES.CONNECTION_FAILED, isLoading: false }));
    });

    socketInstance.on(SOCKET_EVENTS.DISPLAY_UNAUTHORIZED, () => {
      setIsConnected(false);
      setConnectionError(ERROR_MESSAGES.INVALID_TOKEN);
      setDisplayState(prev => ({ ...prev, isConnected: false, connectionError: ERROR_MESSAGES.INVALID_TOKEN }));
    });

    // Game events
    socketInstance.on(SOCKET_EVENTS.GAME_START, (data) => {
      console.log('🚀 Game start event received:', data);
      if (data?.gameId) {
        setGameState(prev => {
          const newState = {
            ...prev,
            gameStatus: 'active' as const,
            gameId: data.gameId,
            eventId: data.eventId
          };
          console.log('🚀 Updated game state after game start:', newState);
          return newState;
        });
        
        // When game starts, close cartela display and don't reopen
        if (onCloseCartelasRef.current) {
          console.log('🚀 Game started - closing cartela display and keeping it closed');
          onCloseCartelasRef.current();
          
          // Set a flag to prevent cartela display from reopening
          if (token) {
            localStorage.setItem(`cartela_display_${token}_just_started`, 'true');
            console.log('🚀 Set flag to prevent cartela display from reopening');
          }
        }
        
        // Request fresh game data after game starts to ensure all fields are updated
        setTimeout(() => {
          socketInstance.emit('get_game_data', { sessionId: displayToken });
          console.log('🔄 Requesting fresh game data after game start');
        }, 500);
      } else {
        console.log('🚀 No gameId in game start event:', data);
      }
    });

    socketInstance.on(SOCKET_EVENTS.NUMBER_CALLED, (data) => {
      console.log('📢 Number called event received:', data);
      if (data?.number && data.number >= 1 && data.number <= 75) {
        setGameState(prev => {
          const newState = {
            ...prev,
            currentNumber: data.number,
            currentColumn: getColumnForNumber(data.number),
            calledNumbers: [...prev.calledNumbers, data.number]
          };
          console.log('📢 Updated game state after number called:', newState);
          return newState;
        });
      } else {
        console.log('📢 Invalid number received:', data?.number);
      }
    });

    socketInstance.on(SOCKET_EVENTS.GAME_END, (data) => {
      console.log('Game ended:', data);
      setGameState(prev => ({
        ...prev,
        gameStatus: 'finished'
      }));
      
      // Request final game data when game ends to show final totals
      setTimeout(() => {
        socketInstance.emit('get_game_data', { sessionId: displayToken });
        console.log('🔄 Requesting final game data after game end');
      }, 500);
    });

    socketInstance.on(SOCKET_EVENTS.GAME_CREATED, (data) => {
      if (prevGameIdRef.current && prevGameIdRef.current !== data.gameId && socketInstance) {
        socketInstance.emit(SOCKET_EVENTS.LEAVE_GAME, { gameId: prevGameIdRef.current });
      }
      prevGameIdRef.current = data.gameId;
      setGameState(prev => ({
        ...prev,
        gameId: data.gameId,
        gameStatus: data.status === 'pending' ? 'waiting' : (data.status || 'waiting'),
        calledNumbers: data.calledNumbers || [],
        currentNumber: undefined,
        currentColumn: undefined,
        totalWinStack: data.winStack || 0,
        cartelas: data.cartelas || 0
      }));
      if (data.gameId && socketInstance) {
        socketInstance.emit(SOCKET_EVENTS.JOIN_GAME, { gameId: data.gameId });
      }
    });

    socketInstance.on(SOCKET_EVENTS.GAME_STARTED, (data) => {
      if (prevGameIdRef.current && prevGameIdRef.current !== data.gameId && socketInstance) {
        socketInstance.emit(SOCKET_EVENTS.LEAVE_GAME, { gameId: prevGameIdRef.current });
      }
      prevGameIdRef.current = data.gameId;
      setGameState(prev => ({
        ...prev,
        gameStatus: 'active',
        gameId: data.gameId
      }));
      
      // When game started, close cartela display and don't reopen
      if (onCloseCartelasRef.current) {
        console.log('🚀 Game started - closing cartela display and keeping it closed');
        onCloseCartelasRef.current();
        
        // Set a flag to prevent cartela display from reopening
        if (token) {
          localStorage.setItem(`cartela_display_${token}_just_started`, 'true');
          console.log('🚀 Set flag to prevent cartela display from reopening');
        }
      }
      
      if (data.gameId && socketInstance) {
        socketInstance.emit(SOCKET_EVENTS.JOIN_GAME, { gameId: data.gameId });
      }
    });

    socketInstance.on(SOCKET_EVENTS.GAME_PAUSED, () => {
      setGameState(prev => ({ ...prev, gameStatus: 'paused' }));
    });

    socketInstance.on(SOCKET_EVENTS.GAME_RESUMED, () => {
      setGameState(prev => ({ ...prev, gameStatus: 'active' }));
      
      // Request fresh game data when game resumes to ensure all fields are updated
      setTimeout(() => {
        socketInstance.emit('get_game_data', { sessionId: displayToken });
        console.log('🔄 Requesting fresh game data after game resume');
      }, 500);
    });

    // Listen for comprehensive game reset event
    socketInstance.on('game_reset', (data) => {
      console.log('🔄 Game reset received on display:', data);
      console.log('🔄 Current gameState before reset:', gameState);
      setGameState(prev => {
        const newState = {
          ...prev,
          gameId: data.gameId,
          gameStatus: 'waiting' as const,
          calledNumbers: data.calledNumbers || [],
          currentNumber: undefined,
          currentColumn: undefined,
          // IMPORTANT: Don't clear betting data on game reset - preserve existing values
          cartelas: data.cartelas ?? prev.cartelas,      // Use data if provided, otherwise keep existing
          totalWinStack: data.totalWinStack ?? prev.totalWinStack, // Use data if provided, otherwise keep existing
          totalStack: data.totalStack ?? prev.totalStack, // Use data if provided, otherwise keep existing
          // Clear additional properties to match server clearing
          eventId: undefined,
          gameHistory: [],
          top3Winners: [],
          isLoadingGameData: false,
          sessionId: undefined
        };
        console.log('🔄 New gameState after reset:', newState);
        return newState;
      });
      
      // Request fresh game data after reset to ensure all fields are properly initialized
      setTimeout(() => {
        socketInstance.emit('get_game_data', { sessionId: displayToken });
        console.log('🔄 Requesting fresh game data after game reset');
      }, 500);
    });

    socketInstance.on(SOCKET_EVENTS.GAME_ENDED, (data) => {
      console.log('🎮 Game ended event received on display:', data);
      console.log('🎮 Current gameState before update:', gameState);
      setGameState(prev => {
        const newState = { 
          ...prev, 
          gameStatus: 'waiting' as const, // Changed from 'finished' to 'waiting' for new game
          currentNumber: undefined,
          currentColumn: undefined,
          calledNumbers: [], // Clear called numbers
          // IMPORTANT: Don't clear betting data when game ends - it should be preserved for the next game
          // cartelas: 0, // Keep existing betting data
          // totalWinStack: 0, // Keep existing betting data
          // Clear additional properties that match server clearing
          eventId: undefined,
          gameHistory: [],
          top3Winners: [],
          isLoadingGameData: false,
          sessionId: undefined
        };
        console.log('🎮 New gameState after update:', newState);
        console.log('🎮 Game status set to waiting - ready for new game');
        return newState;
      });
      
      // Auto-close cartela display when game ends
      if (onCloseCartelasRef.current) {
        onCloseCartelasRef.current();
      }
      
      // Request final game data when game ends to show final totals
      setTimeout(() => {
        socketInstance.emit('get_game_data', { sessionId: displayToken });
        console.log('🔄 Requesting final game data after game ended');
      }, 500);
    });



    socketInstance.on(SOCKET_EVENTS.NUMBER_DRAWN, (data) => {
      console.log('🎲 Number drawn event received:', data);
      setDisplayState(prev => ({ ...prev, isDrawing: true }));
      setGameState(prev => {
        const newState = {
          ...prev,
          calledNumbers: data.calledNumbers || prev.calledNumbers,
          currentNumber: data.number,
          currentColumn: data.number ? getColumnForNumber(data.number) : undefined
        };
        return newState;
      });
      
      // Play number sound if sound callbacks are available
      if (soundCallbacksRef.current?.playNumberSound && data.number) {
        soundCallbacksRef.current.playNumberSound(data.number);
      }
      
      setTimeout(() => {
        setDisplayState(prev => ({ ...prev, isDrawing: false }));
      }, 2000);
    });

    socketInstance.on(SOCKET_EVENTS.GAME_UPDATE, (data) => {
      console.log('🔄 Game update event received:', data);
      setGameState(prev => {
        const newState = {
          ...prev,
          gameStatus: data.status ? (data.status === 'pending' ? 'waiting' : data.status) : prev.gameStatus,
          cartelas: typeof data.cartelas === 'number' ? data.cartelas : prev.cartelas,
          totalWinStack: typeof data.winStack === 'number' ? data.winStack : prev.totalWinStack,
          totalStack: typeof data.totalStack === 'number' ? data.totalStack : prev.totalStack
        };
        console.log('🔄 Updated game state after game update:', newState);
        return newState;
      });
      
      // Request fresh game data after game update to ensure all fields are properly synced
      setTimeout(() => {
        socketInstance.emit('get_game_data', { sessionId: displayToken });
        console.log('🔄 Requesting fresh game data after game update');
      }, 500);
    });

    // Listen for real-time game data updates
    socketInstance.on('game_data_updated', (data) => {
      console.log('🔄 Real-time game data update on display:', data);
      console.log('🔄 Current gameState.gameId before update:', gameState.gameId);
      if (data?.id) {
        console.log('🔄 Updating gameId to:', data.id);
        setGameState(prev => {
          console.log('🔄 Previous gameId:', prev.gameId);
          // Only update gameId if we don't have one or if the new one is different and valid
          const shouldUpdateGameId = !prev.gameId || (data.id && data.id !== prev.gameId);
          
          // IMPORTANT: Betting data should ALWAYS be preserved and updated, regardless of game status
          // Only game progress data (called numbers, current number) should be cleared when game is waiting
          const isGameWaiting = data.status === 'waiting';
          
          const newState = {
            ...prev,
            gameId: shouldUpdateGameId ? data.id : prev.gameId, // Use the formatted game ID
            gameStatus: data.status || prev.gameStatus,
            // Game progress data - clear when waiting, preserve when active
            calledNumbers: isGameWaiting ? [] : (data.gameData?.calledNumbers || prev.calledNumbers),
            currentNumber: isGameWaiting ? undefined : (data.gameData?.currentNumber || prev.currentNumber),
            currentColumn: isGameWaiting ? undefined : (data.gameData?.currentNumber ? getColumnForNumber(data.gameData.currentNumber) : prev.currentColumn),
            // BETTING DATA - ALWAYS preserve and update from database
            totalWinStack: data.gameData?.totalWinStack ?? prev.totalWinStack,
            totalStack: data.gameData?.totalStack ?? prev.totalStack,
            cartelas: data.gameData?.cartelas ?? prev.cartelas,
            stack: data.gameData?.stack ?? prev.stack, // Add individual stake amount
            // New financial breakdown fields
            totalShopMargin: data.gameData?.totalShopMargin ?? prev.totalShopMargin,
            totalSystemFee: data.gameData?.totalSystemFee ?? prev.totalSystemFee,
            netPrizePool: data.gameData?.netPrizePool ?? prev.netPrizePool,
            netShopProfit: data.gameData?.netShopProfit ?? prev.netShopProfit, // Add net shop profit
            isLoadingGameData: false
          };
          console.log('🔄 New gameState.gameId:', newState.gameId);
          console.log('🔄 Game waiting check:', isGameWaiting);
          console.log('🔄 Called numbers:', newState.calledNumbers);
          console.log('🔄 Current number:', newState.currentNumber);
          console.log('🔄 Betting data updated - cartelas:', newState.cartelas, 'stack:', newState.stack, 'totalStack:', newState.totalStack, 'totalWinStack:', newState.totalWinStack, 'totalShopMargin:', newState.totalShopMargin, 'totalSystemFee:', newState.totalSystemFee, 'netPrizePool:', newState.netPrizePool, 'netShopProfit:', newState.netShopProfit);
          
          // Auto-close cartela display when game becomes active
          if (data.status === 'active' && onCloseCartelasRef.current) {
            onCloseCartelasRef.current();
          }
          
          return newState;
        });
      } else {
        console.log('🔄 No data.id found in update:', data);
      }
    });

    // Listen for game ID updates specifically
    socketInstance.on('game_id_updated', (data) => {
      console.log('🆔 Game ID update event received:', data);
      console.log('🆔 New game ID:', data.gameId);
      console.log('🆔 Current gameState.gameId before update:', gameState.gameId);
      
      if (data?.gameId) {
        // Update gameState (this is what the display uses)
        setGameState(prev => {
          console.log('🆔 Updating gameState.gameId from', prev.gameId, 'to', data.gameId);
          return {
            ...prev,
            gameId: data.gameId
          };
        });
        
        console.log('🆔 Game ID updated to:', data.gameId);
        console.log('🆔 gameState.gameId should now show:', data.gameId);
      } else {
        console.error('🆔 No gameId in game_id_updated event:', data);
      }
    });

    // Listen for game data response from manual refresh
    socketInstance.on('game_data_response', (data) => {
      console.log('🔄 Game data response from manual refresh:', data);
      console.log('🔄 Current gameState.gameId before update:', gameState.gameId);
      if (data?.id) {
        console.log('🔄 Updating gameId to:', data.id);
        setGameState(prev => {
          console.log('🔄 Previous gameId:', prev.gameId);
          // Only update gameId if we don't have one or if the new one is different and valid
          const shouldUpdateGameId = !prev.gameId || (data.id && data.id !== prev.gameId);
          
          // IMPORTANT: Betting data should ALWAYS be preserved and updated, regardless of game status
          // Only game progress data (called numbers, current number) should be cleared when game is waiting
          const isGameWaiting = data.status === 'waiting';
          
          const newState = {
            ...prev,
            gameId: shouldUpdateGameId ? data.id : prev.gameId, // Use the formatted game ID
            gameStatus: data.status || prev.gameStatus,
            // Game progress data - clear when waiting, preserve when active
            calledNumbers: isGameWaiting ? [] : (data.gameData?.calledNumbers || prev.calledNumbers),
            currentNumber: isGameWaiting ? undefined : (data.gameData?.currentNumber || prev.currentNumber),
            currentColumn: isGameWaiting ? undefined : (data.gameData?.currentNumber ? getColumnForNumber(data.gameData.currentNumber) : prev.currentColumn),
            // BETTING DATA - ALWAYS preserve and update from database
            totalWinStack: data.gameData?.totalWinStack ?? prev.totalWinStack,
            totalStack: data.gameData?.totalStack ?? prev.totalStack,
            cartelas: data.gameData?.cartelas ?? prev.cartelas,
            // New financial breakdown fields
            totalShopMargin: data.gameData?.totalShopMargin ?? prev.totalShopMargin,
            totalSystemFee: data.gameData?.totalSystemFee ?? prev.totalSystemFee,
            netPrizePool: data.gameData?.netPrizePool ?? prev.netPrizePool,
            isLoadingGameData: false
          };
          console.log('🔄 New gameState.gameId:', newState.gameId);
          console.log('🔄 Game waiting check:', isGameWaiting);
          console.log('🔄 Called numbers:', newState.calledNumbers);
          console.log('🔄 Current number:', newState.currentNumber);
          console.log('🔄 Betting data updated - cartelas:', newState.cartelas, 'totalStack:', newState.totalStack, 'totalWinStack:', newState.totalWinStack, 'totalShopMargin:', newState.totalShopMargin, 'totalSystemFee:', newState.totalSystemFee, 'netPrizePool:', newState.netPrizePool);
          
          // Auto-close cartela display when game becomes active
          if (data.status === 'active' && onCloseCartelasRef.current) {
            onCloseCartelasRef.current();
          }
          
          return newState;
        });
      } else {
        console.log('🔄 No data.id found in response:', data);
      }
    });

    // Verification events
    socketInstance.on(SOCKET_EVENTS.CARTELA_VERIFIED, (data) => {
      console.log('🎉 Cartela verified event received on display:', data);
      setVerificationData(data);
      setDisplayState(prev => ({ 
        ...prev, 
        showVerificationModal: true, 
        modalPersistent: true 
      }));
      
      // Play win or lost sound based on verification result
      if (soundCallbacksRef.current) {
        if (data.status === 'won') {
          soundCallbacksRef.current.playWinSound();
        } else if (data.status === 'lost') {
          soundCallbacksRef.current.playLostSound();
        }
      }
    });

    socketInstance.on(SOCKET_EVENTS.CLOSE_VERIFICATION_MODAL, (data) => {
      console.log('🔍 Cashier requested to close verification modal:', data);
      
      // Verify this is for our session
      if (data && data.sessionId === displayToken) {
        console.log('✅ Closing verification modal for our session');
        setDisplayState(prev => ({ 
          ...prev, 
          showVerificationModal: false, 
          modalPersistent: false 
        }));
        setVerificationData(null);
      } else {
        console.log('⚠️ Close modal event received but session mismatch:', { 
          eventSessionId: data?.sessionId, 
          ourSessionId: displayToken 
        });
      }
    });
    
    // Additional listener for direct display communication
    socketInstance.on('close-verification-modal-display', (data) => {
      console.log('🔍 Direct display close verification modal event:', data);
      
      // Verify this is for our session
      if (data && data.sessionId === displayToken) {
        console.log('✅ Closing verification modal via direct display event');
        setDisplayState(prev => ({ 
          ...prev, 
          showVerificationModal: false, 
          modalPersistent: false 
        }));
        setVerificationData(null);
      } else {
        console.log('⚠️ Direct display close event session mismatch:', { 
          eventSessionId: data?.sessionId, 
          ourSessionId: displayToken 
        });
      }
    });

    // Game session events
    socketInstance.on('game_session_info', (data) => {
      console.log('🎮 Game session info received:', data);
      console.log('🎮 Current gameState.gameId before update:', gameState.gameId);
      setGameState(prev => {
        console.log('🎮 Previous gameId:', prev.gameId);
        // Only update gameId if we don't have one or if the new one is different and valid
        const shouldUpdateGameId = !prev.gameId || (data.gameId && data.gameId !== prev.gameId);
        const newState = {
          ...prev,
          gameId: shouldUpdateGameId ? data.gameId : prev.gameId,
          sessionId: data.sessionId,
          gameStatus: data.status
        };
        console.log('🎮 New gameState.gameId:', newState.gameId);
        return newState;
      });
    });

    socketInstance.on('room_joined', (data) => {
      console.log('🎮 Joined game room:', data);
    });

    socketInstance.on('user_joined_room', (data) => {
      console.log('🎮 User joined room:', data);
    });

    socketInstance.on('cashier_joined_room', (data) => {
      console.log('👤 Cashier joined room:', data);
      console.log('👤 Current gameState.gameId before update:', gameState.gameId);
      // Update connection status when cashier joins
      setDisplayState(prev => ({ 
        ...prev, 
        isConnected: true 
      }));
      
      // Update game ID if provided
      if (data?.gameId) {
        console.log('👤 Updating gameId to:', data.gameId);
        setGameState(prev => {
          console.log('👤 Previous gameId:', prev.gameId);
          // Only update gameId if we don't have one or if the new one is different and valid
          const shouldUpdateGameId = !prev.gameId || (data.gameId && data.gameId !== prev.gameId);
          const newState = {
            ...prev,
            gameId: shouldUpdateGameId ? data.gameId : prev.gameId
          };
          console.log('👤 New gameState.gameId:', newState.gameId);
          return newState;
        });
      } else {
        console.log('👤 No gameId provided in cashier_joined_room event');
      }
    });

    // Listen for connection status updates
    socketInstance.on('connection_status_update', (data) => {
      console.log('🔄 Connection status update received:', data);
      if (data.sessionId === displayToken) {
        setDisplayState(prev => ({ 
          ...prev, 
          isConnected: data.displayConnected || false 
        }));
      }
    });

    // Listen for display connection status updates
    socketInstance.on('display:connection_status', (data) => {
      console.log('📺 Display connection status update received:', data);
      if (data.sessionId === displayToken) {
        setDisplayState(prev => ({ 
          ...prev, 
          isConnected: data.connected || false 
        }));
      }
    });

    // Listen for display connected event
    socketInstance.on('display:connected', (data) => {
      console.log('📺 Display connected event received:', data);
      setDisplayState(prev => ({ 
        ...prev, 
        isConnected: true 
      }));
    });

    // Listen for display waiting for game event
    socketInstance.on('display:waiting_for_game', (data) => {
      console.log('📺 Display waiting for game event received:', data);
      setDisplayState(prev => ({ 
        ...prev, 
        isConnected: false,
        connectionError: 'Waiting for game to start...'
      }));
    });

    // Listen for display error event (this should rarely happen now)
    socketInstance.on('display:error', (data) => {
      console.log('📺 Display error event received:', data);
      setDisplayState(prev => ({ 
        ...prev, 
        isConnected: false,
        connectionError: data.message || 'Connection error occurred'
      }));
    });

    // Handle cartela display events
    socketInstance.on('show_cartelas', (data: { timestamp: Date }) => {
      console.log('📋 Show cartelas event received:', data.timestamp);
      // This event is sent from the display when cartelas are shown
    });

    // Handle close cartelas event - when display should be closed (e.g., game starting or ending)
    socketInstance.on('close_cartelas', (data: { timestamp: Date }) => {
      console.log('📋 Close cartelas event received:', data);
      console.log('📋 Closing cartela display as requested');
      
      // Call the onCloseCartelas callback to close the display
      if (onCloseCartelasRef.current) {
        onCloseCartelasRef.current();
      }
      
      console.log('📋 Cartela display closed successfully');
    });

    // Listen for refresh pages event (when end game is clicked or verification modal closed)
    socketInstance.on('refresh_pages', (data: { message?: string; sessionId?: string; timestamp?: string }) => {
      console.log('🔄 Refresh pages event received:', data);
      console.log('🔄 Event details:', { message: data.message, sessionId: data.sessionId, timestamp: data.timestamp });
      console.log('🔄 Our sessionId:', displayToken);
      
      // Check if this is an end game refresh event
      if (data.message && data.message.includes('Game ended')) {
        console.log('🏁 End game detected - refreshing display page...');
        // Refresh the page for end game
        window.location.reload();
      } 
      // Check if this is a verification modal close event
      else if (data.message && data.message.includes('Verification modal closed')) {
        console.log('🔍 Verification modal close detected via refresh_pages - refreshing display page...');
        // Refresh the page for verification modal close
        window.location.reload();
      }
      else {
        console.log('🔄 This is a general refresh event - not refreshing page');
        // For other general refresh events, don't refresh the page
      }
    });

    // Listen for verification modal close event (specific to verification modal)
    socketInstance.on('verification_modal_closed', (data: { message?: string; sessionId?: string; timestamp?: string }) => {
      console.log('🔍 Verification modal closed event received:', data);
      console.log('🔍 Event details:', { message: data.message, sessionId: data.sessionId, timestamp: data.timestamp });
      console.log('🔍 Our sessionId:', displayToken);
      console.log('🔍 Verification modal close detected - refreshing display page...');
      // Refresh the page to get fresh state
      window.location.reload();
    });

    // Listen for game completed event (when someone wins)
    socketInstance.on('game_completed', (data: { 
      gameId: string; 
      winnerCartelaId: number; 
      winnerTicketNumber: string; 
      winningPatterns: string[];
      completedAt: Date;
      gameData: Record<string, unknown>;
    }) => {
      console.log('🏆 Game completed event received:', data);
      console.log(`🏆 Winner: Cartela ${data.winnerCartelaId} with ticket ${data.winnerTicketNumber}`);
      console.log(`🏆 Winning patterns: ${data.winningPatterns.join(', ')}`);
      
      // Update game state to completed
      setGameState(prev => ({
        ...prev,
        gameStatus: 'completed',
        gameId: data.gameId
      }));
      
      // Play win sound when game is completed
      if (soundCallbacksRef.current?.playWinSound) {
        soundCallbacksRef.current.playWinSound();
      }
      
      // Show winner announcement (you can customize this)
      console.log('🏆 Game completed! Display will show winner information');
    });

    // Listen for end game event (when cashier manually ends game)
    socketInstance.on('end_game', (data: { 
      gameId: string; 
      sessionId: string; 
      endedAt: Date; 
      message: string;
    }) => {
      console.log('🏁 End game event received:', data);
      console.log('🏁 Game ended by cashier:', data.message);
      
      // Update game state to completed
      setGameState(prev => ({
        ...prev,
        gameStatus: 'completed',
        gameId: data.gameId
      }));
      
      // The refresh_pages event will handle the page refresh
    });

    // REMOVED: Duplicate game_reset handler - using the one above
    
    // Listen for game data refresh events
    socketInstance.on('game_data_refresh', (data: { message?: string }) => {
      console.log('🔄 Game data refresh received:', data);
      // Trigger a normal data update instead of page reload
      // The existing game_data_updated listener will handle this
    });

    // Listen for cartela selection events
    socketInstance.on('cartela_selected', (data: { cartelaId: number; timestamp: Date }) => {
      console.log('🎯 Cartela selected event received:', data);
      setGameState(prev => {
        const newSelectedCartelas = [...(prev.selectedCartelas || []), data.cartelaId];
        console.log('🎯 Previous selectedCartelas:', prev.selectedCartelas);
        console.log('🎯 New selectedCartelas:', newSelectedCartelas);
        return {
          ...prev,
          selectedCartelas: newSelectedCartelas
        };
      });
    });

    console.log('🎯 cartela_selected event listener set up successfully');

    socketInstance.on('cartela_deselected', (data: { cartelaId: number; timestamp: Date }) => {
      console.log('❌ Cartela deselected event received:', data);
      setGameState(prev => {
        const newSelectedCartelas = (prev.selectedCartelas || []).filter(id => id !== data.cartelaId);
        console.log('❌ Previous selectedCartelas:', prev.selectedCartelas);
        console.log('❌ New selectedCartelas:', newSelectedCartelas);
        return {
          ...prev,
          selectedCartelas: newSelectedCartelas
        };
      });
    });

    // Handle clearing all cartelas (new event for Clear button)
    // Now immediately refresh the cartela list content in real-time
    socketInstance.on('cartelas_cleared', (data: { sessionId: string; timestamp: Date }) => {
      console.log('🧹 Cartelas cleared event received:', data);
      console.log('🧹 Immediately refreshing cartela list content for real-time update');
      
      // Immediately clear selected cartelas for instant visual feedback
      setGameState(prevState => ({
        ...prevState,
        selectedCartelas: [] // Clear all selections immediately
      }));
      
      // Also emit a custom event to trigger immediate refresh on the display page
      const customEvent = new CustomEvent('cartelas_cleared', {
        detail: {
          type: 'cartelas_cleared',
          sessionId: data.sessionId,
          timestamp: data.timestamp
        }
      });
      window.dispatchEvent(customEvent);
      
      console.log('🧹 Emitted cartelas_cleared custom event for immediate display refresh');
      
      // Refresh the display page when cartelas are cleared
      console.log('🔄 Refreshing display page after cartelas cleared...');
      setTimeout(() => {
        window.location.reload();
      }, 50); // Small delay to ensure the clear operation is processed
    });

    console.log('❌ cartela_deselected event listener set up successfully');

    socketInstance.on('cartela_selections_response', (data: { selectedCartelas: number[]; timestamp: Date }) => {
      console.log('📊 Received cartela selections:', data.selectedCartelas);
      setGameState(prevState => ({
        ...prevState,
        selectedCartelas: data.selectedCartelas
      }));
    });

    // Handle ticket cancellation events
    socketInstance.on('ticket_cancelled', (data: { ticketNumber: string; cartelaId: number; gameId: string; sessionId: string; timestamp: Date }) => {
      console.log('❌ Ticket cancelled event received on display:', data);
      console.log('❌ Current gameState.selectedCartelas before update:', gameState.selectedCartelas);
      
      // Update game state to reflect the cancelled ticket
      setGameState(prevState => {
        // Remove the cancelled cartela from selected cartelas if it was selected
        const newSelectedCartelas = (prevState.selectedCartelas || []).filter(id => id !== data.cartelaId);
        
        console.log('❌ Filtered out cartelaId:', data.cartelaId);
        console.log('❌ New selectedCartelas array:', newSelectedCartelas);
        
        return {
          ...prevState,
          selectedCartelas: newSelectedCartelas,
          // Note: Game data will be updated separately via game_data_updated event
        };
      });
      
      console.log('❌ Display updated for cancelled ticket:', data.ticketNumber);
      console.log('❌ GameState.selectedCartelas should now be updated');
    });


    // Reconnection events
    socketInstance.on(SOCKET_EVENTS.RECONNECT, () => {
      console.log('Reconnected to server');
      setIsConnected(true);
      setConnectionError(null);
      setIsLoading(false);
      setDisplayState(prev => ({ 
        ...prev, 
        isConnected: true, 
        connectionError: null, 
        isLoading: false 
      }));
    });

    socketInstance.on(SOCKET_EVENTS.RECONNECT_ERROR, (error) => {
      console.error('Reconnection error:', error);
      setIsConnected(false);
      setConnectionError(ERROR_MESSAGES.RECONNECTION_FAILED);
      setDisplayState(prev => ({ 
        ...prev, 
        isConnected: false, 
        connectionError: ERROR_MESSAGES.RECONNECTION_FAILED 
      }));
    });

    // Handle page refresh event
    socketInstance.on('refresh_pages', (data: { message: string; timestamp: Date }) => {
      console.log('🔄 Page refresh event received on display:', data);
      console.log('🔄 Refreshing page for new game...');
      
      // Force page refresh to show new game state
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    });

    // Handle close cartelas event
    socketInstance.on('close_cartelas', (data: { timestamp: Date }) => {
      console.log('📋 Close cartelas event received on display:', data);
      
      // Close cartela display when requested
      if (onCloseCartelasRef.current) {
        onCloseCartelasRef.current();
      }
    });

    // Handle 3D shuffle animation events
    socketInstance.on('display:shuffle_animation', (data: { sessionId: string; cashierId: string; action: string; timestamp: Date }) => {
      console.log('🎲 3D shuffle animation event received:', data);
      console.log('🎲 Current displayState before update:', displayState);
      console.log('🎲 Action received:', data.action);
      console.log('🎲 Session ID match:', data.sessionId === displayToken);
      
      if (data.action === 'start') {
        console.log('🎲 Starting 3D mixer animation...');
        
        // Show 3D mixer animation
        setDisplayState(prev => {
          const newState = {
            ...prev,
            show3DMixer: true,
            isShuffling: true
          };
          console.log('🎲 New displayState after update:', newState);
          return newState;
        });
        
        console.log('🎲 3D mixer animation started on display');
      } else if (data.action === 'complete') {
        console.log('🎲 Completing 3D mixer animation...');
        
        // Hide 3D mixer animation
        setDisplayState(prev => {
          const newState = {
            ...prev,
            show3DMixer: false,
            isShuffling: false
          };
          console.log('🎲 New displayState after update:', newState);
          return newState;
        });
        
        console.log('🎲 3D mixer animation completed on display');
      }
    });

    // Handle placed bets updated event
    socketInstance.on('placed_bets_updated', (data: { placedBetCartelas: number[]; gameId: string; timestamp: Date }) => {
      console.log('🎫 Placed bets updated event received on display:', data);
      console.log('🎫 New placed bet cartelas:', data.placedBetCartelas);
      console.log('🎫 Game ID:', data.gameId);
      
      // Update game state with new betting data
      setGameState(prev => ({
        ...prev,
        gameId: data.gameId || prev.gameId,
        // The display component will handle updating the placedBets state
      }));
    });

  }, [displayToken]); // Add displayToken as dependency

  // Function to refresh game data (only when needed)
  const refreshGameData = useCallback(() => {
    if (socket && displayToken && isConnected) {
      console.log('🔄 Manual refresh of game data...');
      setGameState(prev => ({ ...prev, isLoadingGameData: true }));
      socket.emit('get_game_data', { sessionId: displayToken });
    }
  }, [socket, displayToken, isConnected]); // Remove setGameState to prevent infinite loops

  // Only refresh once when connected, not continuously
  useEffect(() => {
    if (isConnected && socket && displayToken) {
      // Initial refresh after connection
      setTimeout(() => {
        refreshGameData();
      }, 1000); // Wait 1 second after connection
      
      console.log('🔄 Initial game data refresh scheduled');
      
      // Set up periodic refresh every 30 seconds to keep data in sync
      const intervalId = setInterval(() => {
        if (isConnected && socket && displayToken) {
          console.log('🔄 Periodic game data refresh...');
          socket.emit('get_game_data', { sessionId: displayToken });
        }
      }, 30000); // Refresh every 30 seconds
      
      return () => {
        clearInterval(intervalId);
        console.log('🔄 Periodic refresh cleared');
      };
    }
  }, [isConnected, socket, displayToken]); // Remove refreshGameData to prevent infinite loops

  // Monitor game ID changes for debugging
  useEffect(() => {
    console.log('🎯 Game ID changed:', gameState.gameId);
    console.log('🎯 Formatted game ID:', formatGameIdForDisplay(gameState.gameId));
  }, [gameState.gameId]);

  // Helper function for column detection
  const getColumnForNumber = (number: number): string => {
    if (number >= 1 && number <= 15) return 'B';
    if (number >= 16 && number <= 30) return 'I';
    if (number >= 31 && number <= 45) return 'N';
    if (number >= 46 && number <= 60) return 'G';
    if (number >= 61 && number <= 75) return 'O';
    return '';
  };

    // Initialize socket connection
  useEffect(() => {
    console.log('🔌 useSocket effect running...');
    console.log('🔌 displayToken:', displayToken);
    console.log('🔌 displayToken type:', typeof displayToken);
    console.log('🔌 displayToken length:', displayToken?.length);
    console.log('🔌 onShowCartelas callback exists:', !!onShowCartelas);
    console.log('🔌 onCloseCartelas callback exists:', !!onCloseCartelas);
    
    if (!displayToken) {
      console.log('🔌 No display token, skipping socket initialization');
      return;
    }

    console.log('🔌 Initializing socket...');
    const socketInstance = initializeSocket();
    
    if (socketInstance) {
      console.log('🔌 Socket initialized, setting up listeners...');
      setupSocketListeners(socketInstance, displayToken);
      setSocket(socketInstance);
      console.log('🔌 Socket set in state');
    } else {
      console.error('❌ Failed to initialize socket');
    }

    return () => {
      console.log('🔌 Cleaning up socket...');
      if (socketInstance) {
        socketInstance.disconnect();
        console.log('🔌 Socket disconnected');
      }
    };
  }, [displayToken, initializeSocket, setupSocketListeners]); // Remove onShowCartelas and onCloseCartelas to prevent infinite loops

  return {
    socket,
    isConnected,
    connectionError,
    isLoading,
    gameState,
    displayState,
    verificationData,
    setDisplayState,
    setVerificationData,
  };
} 