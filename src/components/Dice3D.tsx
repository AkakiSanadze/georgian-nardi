import React, { useMemo } from 'react';

interface Dice3DProps {
  value: number; // 1..6
  isRolling: boolean;
  isUsed?: boolean;
  rollIndex: 0 | 1;
  rollKey?: number; // seed to trigger fresh re-roll animation
  size?: number; // in pixels, default 36
  className?: string;
}

// 6-sided die face pip layouts (3x3 grid indices 0..8)
const PIP_MAP: Record<number, number[]> = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

// Resting rotations to bring each face (1..6) facing straight towards camera
const FACE_ROTATIONS: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  6: { x: 180, y: 0 },
  2: { x: 0, y: -90 },
  5: { x: 0, y: 90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
};

export const Dice3D: React.FC<Dice3DProps> = ({
  value,
  isRolling,
  isUsed = false,
  rollIndex,
  rollKey = 0,
  size = 36,
  className = '',
}) => {
  const safeVal = Math.max(1, Math.min(6, value || 1));
  const halfSize = size / 2;

  // Gentle organic resting angle so the two dice don't look computer-rigid
  const restingZ = useMemo(() => {
    const seed = (rollKey * 17 + rollIndex * 31) % 24;
    return rollIndex === 0 ? -12 + (seed % 10) : 10 + (seed % 14);
  }, [rollKey, rollIndex]);

  const targetRotation = FACE_ROTATIONS[safeVal] || { x: 0, y: 0 };
  const finalX = targetRotation.x;
  const finalY = targetRotation.y;
  const finalZ = restingZ;

  // Render one face of the die
  const renderFace = (faceVal: number, transformStyle: string) => {
    const activePips = PIP_MAP[faceVal] || [];
    const isOne = faceVal === 1;

    return (
      <div
        className="absolute inset-0 rounded-[7px] bg-gradient-to-br from-[#ffffff] via-[#f8f3ea] to-[#ded5c5] border border-[#b8a994] shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.95),inset_0_-1.5px_3px_rgba(0,0,0,0.22)] backface-hidden grid grid-cols-3 grid-rows-3 p-1 select-none pointer-events-none"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          transform: transformStyle,
        }}
      >
        {Array.from({ length: 9 }).map((_, idx) => (
          <div key={idx} className="flex items-center justify-center">
            {activePips.includes(idx) && (
              <div
                className={`rounded-full shadow-inner ${
                  isOne
                    ? 'w-2.5 h-2.5 bg-red-700 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]'
                    : 'w-1.5 h-1.5 bg-[#23150d] shadow-[inset_0_0.8px_1.5px_rgba(0,0,0,0.6)]'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  // Trajectory animation classes
  const trackClass = isRolling
    ? rollIndex === 0
      ? 'animate-dice-track-1'
      : 'animate-dice-track-2'
    : '';

  const shadowClass = isRolling
    ? rollIndex === 0
      ? 'animate-shadow-1'
      : 'animate-shadow-2'
    : '';

  // Spin turns when rolling: add 2-3 full 360-degree rotations on all axes
  const initialSpinTurns = rollIndex === 0
    ? { x: finalX + 720, y: finalY + 1080, z: finalZ + 360 }
    : { x: finalX + 1080, y: finalY + 720, z: finalZ - 360 };

  return (
    <div
      className={`relative select-none flex items-center justify-center ${className} ${
        isUsed ? 'opacity-35 scale-90' : 'opacity-100'
      } transition-opacity duration-200`}
      style={{
        width: `${size + 16}px`,
        height: `${size + 16}px`,
      }}
    >
      {/* Dynamic Board Drop Shadow */}
      <div
        className={`absolute rounded-full pointer-events-none ${shadowClass}`}
        style={{
          width: `${size * 1.15}px`,
          height: `${size * 0.65}px`,
          bottom: '2px',
          background: 'radial-gradient(ellipse at center, rgba(18,9,3,0.78) 0%, rgba(18,9,3,0.35) 60%, transparent 100%)',
          transition: isRolling ? undefined : 'transform 0.25s ease-out, opacity 0.25s ease-out',
        }}
      />

      {/* 3D Perspective & Bounce Container */}
      <div
        className={`perspective-800 relative ${trackClass}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          translate: '0px',
          rotate: '0deg',
          scale: '1',
        }}
      >
        {/* 3D Cube with 6 faces */}
        <div
          key={`${rollKey}-${rollIndex}-${safeVal}`}
          className="preserve-3d relative w-full h-full"
          style={{
            transform: isRolling
              ? undefined
              : `rotateX(${finalX}deg) rotateY(${finalY}deg) rotateZ(${finalZ}deg)`,
            animation: isRolling
              ? `diceTumble${rollIndex} 0.75s var(--bounce-easing, cubic-bezier(0.2, 0.8, 0.4, 1)) forwards`
              : undefined,
            transition: isRolling ? undefined : 'transform 0.3s ease-out',
          }}
        >
          {/* Dynamic keyframe rule for tumbling directly to target face */}
          {isRolling && (
            <style>
              {`
                @keyframes diceTumble${rollIndex} {
                  0% {
                    transform: rotateX(${initialSpinTurns.x}deg) rotateY(${initialSpinTurns.y}deg) rotateZ(${initialSpinTurns.z}deg);
                  }
                  100% {
                    transform: rotateX(${finalX}deg) rotateY(${finalY}deg) rotateZ(${finalZ}deg);
                  }
                }
              `}
            </style>
          )}

          {/* Face 1 (Front): Z + halfSize */}
          {renderFace(1, `translateZ(${halfSize}px)`)}

          {/* Face 6 (Back): Y 180deg, Z + halfSize */}
          {renderFace(6, `rotateY(180deg) translateZ(${halfSize}px)`)}

          {/* Face 2 (Right): Y 90deg, Z + halfSize */}
          {renderFace(2, `rotateY(90deg) translateZ(${halfSize}px)`)}

          {/* Face 5 (Left): Y -90deg, Z + halfSize */}
          {renderFace(5, `rotateY(-90deg) translateZ(${halfSize}px)`)}

          {/* Face 3 (Top): X 90deg, Z + halfSize */}
          {renderFace(3, `rotateX(90deg) translateZ(${halfSize}px)`)}

          {/* Face 4 (Bottom): X -90deg, Z + halfSize */}
          {renderFace(4, `rotateX(-90deg) translateZ(${halfSize}px)`)}
        </div>
      </div>
    </div>
  );
};

interface Dice3DPairProps {
  dice: [number, number] | null;
  diceRemaining: number[];
  isRolling: boolean;
  rollKey?: number;
  size?: number;
  className?: string;
}

export const Dice3DPair: React.FC<Dice3DPairProps> = ({
  dice,
  diceRemaining,
  isRolling,
  rollKey = 0,
  size = 36,
  className = '',
}) => {
  if (!dice) return null;

  const [d1, d2] = dice;
  const isDouble = d1 === d2;

  const isD1Used = !diceRemaining.includes(d1);
  const isD2Used = isDouble
    ? diceRemaining.length < (diceRemaining.includes(d2) ? 2 : 1)
    : !diceRemaining.includes(d2);

  return (
    <div className={`flex items-center gap-2 sm:gap-3 pointer-events-none ${className}`}>
      <Dice3D
        value={d1}
        isRolling={isRolling}
        isUsed={isD1Used}
        rollIndex={0}
        rollKey={rollKey}
        size={size}
      />
      <Dice3D
        value={d2}
        isRolling={isRolling}
        isUsed={isD2Used}
        rollIndex={1}
        rollKey={rollKey}
        size={size}
      />
    </div>
  );
};
