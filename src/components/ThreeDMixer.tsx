import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

interface ThreeDMixerProps {
  isVisible: boolean;
  onShuffleComplete: () => void;
  numbers: number[];
}

export function ThreeDMixer({ isVisible, onShuffleComplete, numbers }: ThreeDMixerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mixerRef = useRef<THREE.Mesh | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const animationRef = useRef<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current || !isVisible) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 5);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x00ff88, 2, 10);
    pointLight.position.set(0, 2, 2);
    scene.add(pointLight);

    // Create 3D Mixer Container
    const mixerGeometry = new THREE.SphereGeometry(2, 32, 32);
    const mixerMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.3,
      shininess: 100,
      specular: 0x00ff88
    });
    
    const mixer = new THREE.Mesh(mixerGeometry, mixerMaterial);
    mixer.castShadow = true;
    mixer.receiveShadow = true;
    
    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(2.2, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.1
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    
    const mixerGroup = new THREE.Group();
    mixerGroup.add(mixer);
    mixerGroup.add(glow);
    scene.add(mixerGroup);
    mixerRef.current = mixer;

    // Create particle system for numbers
    const particleCount = numbers.length;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);
    const particleColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      particlePositions[i3] = (Math.random() - 0.5) * 8;
      particlePositions[i3 + 1] = (Math.random() - 0.5) * 8;
      particlePositions[i3 + 2] = (Math.random() - 0.5) * 8;
      
      particleSizes[i] = 0.1;
      
      particleColors[i3] = 1; // Red
      particleColors[i3 + 1] = 1; // Green
      particleColors[i3 + 2] = 1; // Blue
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    particlesRef.current = particles;

    // Add to DOM
    mountRef.current.appendChild(renderer.domElement);

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      if (mixerRef.current) {
        mixerRef.current.rotation.y += 0.01;
        mixerRef.current.rotation.x += 0.005;
      }
      
      if (particlesRef.current) {
        particlesRef.current.rotation.y += 0.005;
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Store ref values at effect time to avoid cleanup warnings
    const currentMount = mountRef.current;
    
    // Handle resize
    const handleResize = () => {
      if (!currentMount || !camera || !renderer) return;
      
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (currentMount && renderer) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer?.dispose();
    };
  }, [isVisible, numbers]);

  // Shuffle animation
  useEffect(() => {
    if (!isVisible || !isAnimating || !particlesRef.current || !mixerRef.current) return;

    const particles = particlesRef.current;
    const mixer = mixerRef.current;
    const positions = particles.geometry.attributes.position.array as Float32Array;

    // Create shuffle timeline
    const tl = gsap.timeline({
      onComplete: () => {
        setIsAnimating(false);
        onShuffleComplete();
      }
    });

    // Phase 1: Numbers fly into mixer with natural curves
    tl.to(positions, {
      duration: 2,
      ease: "power2.inOut",
      onUpdate: () => {
        for (let i = 0; i < positions.length; i += 3) {
          const targetX = (Math.random() - 0.5) * 0.5;
          const targetY = (Math.random() - 0.5) * 0.5;
          const targetZ = (Math.random() - 0.5) * 0.5;
          
          // Natural curved movement
          positions[i] = THREE.MathUtils.lerp(positions[i], targetX, 0.08);
          positions[i + 1] = THREE.MathUtils.lerp(positions[i + 1], targetY, 0.08);
          positions[i + 2] = THREE.MathUtils.lerp(positions[i + 2], targetZ, 0.08);
        }
        particles.geometry.attributes.position.needsUpdate = true;
      }
    });

    // Phase 2: Mixer spins and glows
    tl.to(mixer.rotation, {
      y: mixer.rotation.y + Math.PI * 6,
      duration: 2.5,
      ease: "power2.inOut"
    }, "-=2");

    tl.to(mixer.material, {
      opacity: 0.9,
      duration: 1.5,
      ease: "power2.inOut"
    }, "-=2.5");

    // Phase 3: Numbers fly back to board with natural transitions
    tl.to(positions, {
      duration: 2.5,
      ease: "power2.out",
      onUpdate: () => {
        for (let i = 0; i < positions.length; i += 3) {
          const targetX = (Math.random() - 0.5) * 8;
          const targetY = (Math.random() - 0.5) * 8;
          const targetZ = (Math.random() - 0.5) * 8;
          
          // Staggered, natural movement
          const stagger = (i / 3) * 0.02;
          const progress = Math.min(1, (tl.time() - 4.5 + stagger) / 2.5);
          
          if (progress > 0) {
            positions[i] = THREE.MathUtils.lerp(positions[i], targetX, 0.06);
            positions[i + 1] = THREE.MathUtils.lerp(positions[i + 1], targetY, 0.06);
            positions[i + 2] = THREE.MathUtils.lerp(positions[i + 2], targetZ, 0.06);
          }
        }
        particles.geometry.attributes.position.needsUpdate = true;
      }
    });

    // Phase 4: Reset mixer
    tl.to(mixer.material, {
      opacity: 0.3,
      duration: 0.8,
      ease: "power2.out"
    }, "-=0.8");

  }, [isVisible, isAnimating, onShuffleComplete]);



  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      <div className="relative w-full h-full">
        <div ref={mountRef} className="w-full h-full" />
        
        {/* Title */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center">
          <h1 className="text-6xl font-bold text-green-400 mb-4 drop-shadow-lg">
            🎯 3D Number Mixer
          </h1>
          <p className="text-xl text-white opacity-80 max-w-2xl">
            Watch the magic happen as your numbers get shuffled with professional 3D animations!
          </p>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
          <div className="bg-black bg-opacity-50 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-green-400 mb-2">🎲 Shuffle in Progress</h3>
            <p className="text-white opacity-90">
              {isAnimating ? 'Numbers are being shuffled...' : 'Shuffle complete!'}
            </p>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={() => onShuffleComplete()}
          className="absolute top-8 right-8 text-white text-3xl hover:text-green-400 transition-colors duration-300 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center backdrop-blur-sm"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
