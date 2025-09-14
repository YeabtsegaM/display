import { useState, useCallback, useRef, useEffect } from 'react';

export type SoundType = 'AM' | 'OR' | 'TG';

interface UseSoundManagerReturn {
  soundType: SoundType;
  setSoundType: (type: SoundType) => void;
  playNumberSound: (number: number) => void;
  playWinSound: () => void;
  isMuted: boolean;
  toggleMute: () => void;
  isDrawingActive: boolean;
  activateDrawingMode: () => void;
  deactivateDrawingMode: () => void;
}

export function useSoundManager(): UseSoundManagerReturn {
  const [soundType, setSoundType] = useState<SoundType>(() => {
    // Load from localStorage on initialization (only on client side)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bingo_sound_type');
      return (saved as SoundType) || 'AM';
    }
    return 'AM';
  });
  
  const [isMuted, setIsMuted] = useState(() => {
    // Load from localStorage on initialization (only on client side)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bingo_sound_muted');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  
  // Track if user has interacted with the page (required for audio autoplay)
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  
  // Track if drawing is active (for automatic sound activation)
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  
  // Function to unlock audio context
  const unlockAudioContext = useCallback(() => {
    try {
      // Create a silent audio context to unlock audio
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Set volume to 0 (silent)
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      
      // Start and immediately stop to unlock
      oscillator.start();
      oscillator.stop();
      
      return true;
    } catch (error) {
      console.warn('Failed to unlock audio context:', error);
      return false;
    }
  }, []);
  
  // Set user interaction flag when any user action occurs
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true);
        
        // Try to unlock audio context on user interaction
        unlockAudioContext();
      }
    };
    
    // Listen for various user interactions
    const events = ['click', 'touchstart', 'keydown', 'mousedown'];
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { once: true });
    });
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, [hasUserInteracted, unlockAudioContext]);
  
  // For display purposes, try to unlock audio on page load
  useEffect(() => {
    // Try to unlock audio context immediately for display purposes
    const timer = setTimeout(() => {
      unlockAudioContext();
    }, 1000); // Wait 1 second after page load
    
    return () => clearTimeout(timer);
  }, [unlockAudioContext]);
  
  // Function to activate drawing mode (called when drawing starts)
  const activateDrawingMode = useCallback(() => {
    setIsDrawingActive(true);
    // Force unlock audio context when drawing starts
    unlockAudioContext();
    
    // Additional audio unlocking strategies for display purposes
    if (typeof window !== 'undefined') {
      // Try to create and play a silent audio to unlock
      try {
        const silentAudio = new Audio();
        silentAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
        silentAudio.play().catch(() => {
          // Ignore errors - this is just to unlock audio
        });
      } catch {
        // Ignore errors - this is just to unlock audio
      }
      
      // Also try to unlock via user interaction simulation
      setTimeout(() => {
        unlockAudioContext();
      }, 100);
    }
  }, [unlockAudioContext]);
  
  // Function to deactivate drawing mode (called when drawing stops)
  const deactivateDrawingMode = useCallback(() => {
    setIsDrawingActive(false);
  }, []);
  
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Get the column letter for a given number
  const getColumnForNumber = (number: number): string => {
    if (number >= 1 && number <= 15) return 'B';
    if (number >= 16 && number <= 30) return 'I';
    if (number >= 31 && number <= 45) return 'N';
    if (number >= 46 && number <= 60) return 'G';
    if (number >= 61 && number <= 75) return 'O';
    return 'B'; // fallback
  };

  // Save sound type to localStorage
  const saveSoundType = (type: SoundType) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bingo_sound_type', type);
    }
  };

  // Save mute state to localStorage
  const saveMuteState = (muted: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bingo_sound_muted', JSON.stringify(muted));
    }
  };

  // Preload audio files for better performance
  const preloadAudio = useCallback((key: string, src: string) => {
    if (!audioRefs.current.has(key)) {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audioRefs.current.set(key, audio);
    }
  }, []);

  // Play number sound when drawn
  const playNumberSound = useCallback((number: number) => {
    if (isMuted || number < 1 || number > 75) {
      return;
    }
    
    // For display purposes, allow sounds to play when:
    // 1. User has interacted with the page, OR
    // 2. Drawing is active (automatic mode)
    if (!hasUserInteracted && !isDrawingActive) {
      // Don't return - continue to play the sound
    }

    const column = getColumnForNumber(number);
    const soundKey = `${soundType}_${column}${number}`;
    const soundPath = `/sounds/${soundType}/${column}${number}.mp3`;

    try {
      // Preload if not already loaded
      preloadAudio(soundKey, soundPath);
      
      const audio = audioRefs.current.get(soundKey);
      if (audio) {
        // Reset and play
        audio.currentTime = 0;
        
        // Try to play with better error handling
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn(`Failed to play sound ${soundPath}:`, error);
            
            // Try to unlock audio context and retry
            if (unlockAudioContext()) {
              setTimeout(() => {
                audio.play().catch(retryError => {
                  console.warn('Retry failed:', retryError);
                });
              }, 100);
            }
          });
        }
      } else {
        // Fallback: create new audio instance
        const newAudio = new Audio(soundPath);
        
        // Try to play with better error handling
        const playPromise = newAudio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn(`Failed to play sound ${soundPath}:`, error);
            
            // Try to unlock audio context and retry
            if (unlockAudioContext()) {
              setTimeout(() => {
                newAudio.play().catch(retryError => {
                  console.warn('Retry failed:', retryError);
                });
              }, 100);
            }
          });
        }
        
        // Store for future use
        audioRefs.current.set(soundKey, newAudio);
      }
    } catch (error) {
      console.error(`Error playing number sound ${soundPath}:`, error);
    }
  }, [soundType, isMuted, preloadAudio, hasUserInteracted, isDrawingActive, unlockAudioContext]);

  // Play win sound
  const playWinSound = useCallback(() => {
    if (isMuted) return;
    
    // For display purposes, allow sounds to play even without user interaction
    if (!hasUserInteracted) {
      // Don't return - continue to play the sound
    }

    // soundKey variable removed as it's not used
    // Try multiple possible win sound files
    const possiblePaths = [
      '/sounds/Win.mp3',
      '/sounds/win.mp3',
      '/sounds/AM/win.m4a',
      '/sounds/OR/win.m4a',
      '/sounds/TG/win.m4a'
    ];

    let soundPlayed = false;
    
    // Try to play the first available sound file
    for (const soundPath of possiblePaths) {
      if (soundPlayed) break;
      
      try {
        const audio = new Audio(soundPath);
        audio.play().then(() => {
          soundPlayed = true;
        }).catch(error => {
          console.warn(`Failed to play win sound from ${soundPath}:`, error);
        });
        
        if (soundPlayed) break;
      } catch (error) {
        console.warn(`Error with ${soundPath}:`, error);
      }
    }
    
    if (!soundPlayed) {
      console.warn('No win sound files found');
    }
  }, [isMuted, hasUserInteracted]);


   
    


  // Toggle mute state
  const toggleMute = useCallback(() => {
    setIsMuted((prev: boolean) => {
      const newMuted = !prev;
      saveMuteState(newMuted);
      return newMuted;
    });
  }, []);

  // Custom setSoundType that saves to localStorage
  const setSoundTypeWithSave = useCallback((type: SoundType) => {
    setSoundType(type);
    saveSoundType(type);
  }, []);

  return {
    soundType,
    setSoundType: setSoundTypeWithSave,
    playNumberSound,
    playWinSound,
    isMuted,
    toggleMute,
    isDrawingActive,
    activateDrawingMode,
    deactivateDrawingMode
  };
}
