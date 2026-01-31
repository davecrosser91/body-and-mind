'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  velocity: number;
  size: number;
  color: string;
  delay: number;
}

interface ParticleBurstProps {
  isActive: boolean;
  origin?: { x: number; y: number };
  particleCount?: number;
  colors?: string[];
  duration?: number;
  spread?: number;
  onComplete?: () => void;
}

const DEFAULT_COLORS = [
  '#E8A854', // body amber
  '#5BCCB3', // mind teal
  '#FFD700', // gold
  '#FF6B6B', // coral
  '#4ECDC4', // turquoise
];

export function ParticleBurst({
  isActive,
  origin = { x: 50, y: 50 },
  particleCount = 24,
  colors = DEFAULT_COLORS,
  duration = 1000,
  spread = 120,
  onComplete,
}: ParticleBurstProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  const generateParticles = useCallback((): Particle[] => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = (360 / particleCount) * i + Math.random() * 30 - 15;
      newParticles.push({
        id: i,
        x: origin.x,
        y: origin.y,
        angle,
        velocity: spread * (0.5 + Math.random() * 0.5),
        size: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)] ?? '#E8A854',
        delay: Math.random() * 0.1,
      });
    }
    return newParticles;
  }, [origin, particleCount, colors, spread]);

  useEffect(() => {
    if (isActive) {
      setParticles(generateParticles());
      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
    setParticles([]);
    return undefined;
  }, [isActive, generateParticles, duration, onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {particles.map((particle) => {
          const radians = (particle.angle * Math.PI) / 180;
          const endX = particle.x + Math.cos(radians) * particle.velocity;
          const endY = particle.y + Math.sin(radians) * particle.velocity;

          return (
            <motion.div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
              }}
              initial={{
                x: 0,
                y: 0,
                scale: 0,
                opacity: 1
              }}
              animate={{
                x: `${(endX - particle.x) * 2}vw`,
                y: `${(endY - particle.y) * 2}vh`,
                scale: [0, 1.5, 1, 0],
                opacity: [1, 1, 0.8, 0],
              }}
              transition={{
                duration: duration / 1000,
                delay: particle.delay,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// Confetti variant with falling effect
interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  rotation: number;
}

interface ConfettiProps {
  isActive: boolean;
  pieceCount?: number;
  colors?: string[];
  duration?: number;
  onComplete?: () => void;
}

export function Confetti({
  isActive,
  pieceCount = 50,
  colors = DEFAULT_COLORS,
  duration = 3000,
  onComplete,
}: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (isActive) {
      const newPieces: ConfettiPiece[] = [];
      for (let i = 0; i < pieceCount; i++) {
        newPieces.push({
          id: i,
          x: Math.random() * 100,
          color: colors[Math.floor(Math.random() * colors.length)] ?? '#E8A854',
          size: 6 + Math.random() * 8,
          delay: Math.random() * 0.5,
          rotation: Math.random() * 360,
        });
      }
      setPieces(newPieces);
      const timer = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
    setPieces([]);
    return undefined;
  }, [isActive, pieceCount, colors, duration, onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {pieces.map((piece) => (
          <motion.div
            key={piece.id}
            className="absolute"
            style={{
              width: piece.size,
              height: piece.size * 0.6,
              backgroundColor: piece.color,
              left: `${piece.x}%`,
              top: -20,
              borderRadius: 2,
            }}
            initial={{
              y: 0,
              rotate: piece.rotation,
              opacity: 1
            }}
            animate={{
              y: '120vh',
              rotate: piece.rotation + 720,
              x: [0, 30, -30, 20, -20, 0],
              opacity: [1, 1, 1, 0.8, 0.5, 0],
            }}
            transition={{
              duration: duration / 1000,
              delay: piece.delay,
              ease: 'linear',
              x: {
                duration: duration / 1000,
                repeat: 0,
                ease: 'easeInOut',
              },
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Celebration hook for easy triggering
export function useCelebration() {
  const [showBurst, setShowBurst] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [burstOrigin, setBurstOrigin] = useState({ x: 50, y: 50 });

  const triggerBurst = useCallback((origin?: { x: number; y: number }) => {
    if (origin) {
      setBurstOrigin(origin);
    }
    setShowBurst(true);
  }, []);

  const triggerConfetti = useCallback(() => {
    setShowConfetti(true);
  }, []);

  const triggerCelebration = useCallback((origin?: { x: number; y: number }) => {
    triggerBurst(origin);
    triggerConfetti();
  }, [triggerBurst, triggerConfetti]);

  return {
    showBurst,
    showConfetti,
    burstOrigin,
    triggerBurst,
    triggerConfetti,
    triggerCelebration,
    dismissBurst: () => setShowBurst(false),
    dismissConfetti: () => setShowConfetti(false),
  };
}
