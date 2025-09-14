import React, { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';

interface InteractiveShuffleProps {
  isVisible: boolean;
  onShuffleComplete: () => void;
  bingoBoardRef: React.RefObject<HTMLDivElement | null>;
}

export function InteractiveShuffle({ isVisible, onShuffleComplete, bingoBoardRef }: InteractiveShuffleProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const mixerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Timeline | null>(null);

  const startShuffleAnimation = useCallback(() => {
    if (!bingoBoardRef.current || !mixerRef.current) return;
    
    setIsAnimating(true);

    // Get all number cells from the Bingo board
    const numberCells = bingoBoardRef.current.querySelectorAll('.bingo-number');
    
    if (numberCells.length === 0) return;

    // Get the current number card (right side) to hide it
    const currentNumberCard = document.querySelector('[data-current-number-card]') as HTMLElement;
    
    // Convert to array and shuffle for random return order
    const cellsArray = Array.from(numberCells);
    const shuffledCells = [...cellsArray].sort(() => Math.random() - 0.5);

    // Create GSAP timeline for the advanced transition animation
    const tl = gsap.timeline({
      onComplete: () => {
        setIsAnimating(false);
        setTimeout(() => {
          onShuffleComplete();
        }, 1000);
      }
    });

    animationRef.current = tl;

    // Phase 1: Hide the current number card (right side)
    if (currentNumberCard) {
      tl.to(currentNumberCard, {
        duration: 0.5,
        opacity: 0,
        scale: 0.9,
        ease: "power2.inOut"
      });
    }

    // Phase 2: All cells disappear together (fade to dark/empty)
    tl.to(numberCells, {
      duration: 0.8,
      opacity: 0,
      scale: 0.8,
      backgroundColor: "#1f2937", // Dark background
      color: "#6b7280", // Dark text
      ease: "power2.inOut"
    }, "-=0.3");

    // Phase 3: Mixer moves from center to right side current number area
    tl.to(mixerRef.current, {
      duration: 0.8,
      x: "550px", // Move to right side area (fixed pixel value)
      y: "-150px", // Move up slightly
      scale: 1.1,
      ease: "power2.inOut"
    }, "-=0.5");

    // Phase 4: Mixer grows and spins in new position
    tl.to(mixerRef.current, {
      duration: 0.8,
      scale: 1.3,
      rotation: 360,
      ease: "power2.out"
    });

    // Phase 5: Mixer shakes and mixes
    tl.to(mixerRef.current, {
      duration: 1.5,
      rotation: "+=720",
      x: "550px", // Keep in right area
      y: "-150px", // Keep in right area
      ease: "power1.inOut",
      repeat: 1
    });

    // Phase 6: Pause to show empty board
    tl.to({}, { duration: 0.5 });

    // Phase 7: Cells return randomly one by one
    shuffledCells.forEach((cell) => {
      tl.to(cell, {
        duration: 0.15,
        opacity: 1,
        scale: 1,
        backgroundColor: "#dc2626", // Original red background
        color: "#ffffff", // Original white text
        ease: "power2.out"
      }, `+=${Math.random() * 0.1}`); // Random delay between 0-0.1s
    });

    // Phase 8: Mixer returns to center
    tl.to(mixerRef.current, {
      duration: 0.8,
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      ease: "power2.out"
    });

    // Phase 9: Show the current number card again
    if (currentNumberCard) {
      tl.to(currentNumberCard, {
        duration: 0.5,
        opacity: 1,
        scale: 1,
        ease: "power2.out"
      }, "-=0.3");
    }
  }, [bingoBoardRef, onShuffleComplete]);

  // Start shuffle animation when component becomes visible
  useEffect(() => {
    if (isVisible && !isAnimating) {
      startShuffleAnimation();
    }
  }, [isVisible, isAnimating, startShuffleAnimation]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* Mixing Container - Starts in center, moves to right side */}
      <div
        ref={mixerRef}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                   w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 
                   rounded-full shadow-2xl border-4 border-green-300
                   flex items-center justify-center text-white font-bold text-2xl
                   animate-pulse"
        style={{
          background: 'radial-gradient(circle, #4ade80 0%, #16a34a 50%, #15803d 100%)',
          boxShadow: '0 0 50px rgba(34, 197, 94, 0.6)'
        }}
      >
        <div className="text-center">
          <div className="text-xl mb-1">Shuffling...</div>
        </div>
      </div>
    </div>
  );
}
