import { useState, useEffect, useCallback } from 'react';
import { isFullscreenSupported, requestFullscreen, exitFullscreen } from '../lib/utils';

export function useFullscreen() {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = useCallback(async () => {
    if (!isFullscreenSupported()) {
      console.warn('Fullscreen is not supported in this browser');
      return;
    }

    try {
      if (!document.fullscreenElement) {
        await requestFullscreen(document.documentElement);
        setIsFullScreen(true);
      } else {
        await exitFullscreen();
        setIsFullScreen(false);
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  return {
    isFullScreen,
    toggleFullScreen,
    isSupported: isFullscreenSupported(),
  };
} 