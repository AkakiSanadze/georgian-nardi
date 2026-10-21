import React from 'react';
import { BoardState, Player } from '../engine/types';
import { Lock, Sparkles, ArrowUpRight } from 'lucide-react';

interface BoardViewProps {
  board: BoardState;
  turn: Player;
  selectedPoint: number | 'BAR' | null;
  legalTargets: number[];
  movableSourcePoints: (number | 'BAR')[];
  lockedHomeHitPoints: number[];
  hintTarget: number | 'OFF' | null;
  hintSource: number | 'BAR' | null;
  showPointNumbers: boolean;
  dice: [number, number] | null;
  diceRemaining: number[];
  isRolling: boolean;
  onPointClick: (point: number | 'BAR') => void;
  onPointDoubleClick: (point: number | 'BAR') => void;
  onBearOffClick: () => void;
}

export const BoardView: React.FC<BoardViewProps> = ({
  board,
  turn,
  selectedPoint,
  legalTargets,
  movableSourcePoints,
  lockedHomeHitPoints,
  hintTarget,
  hintSource,
  showPointNumbers,
  dice,
  diceRemaining,
  isRolling,
  onPointClick,
  onPointDoubleClick,
  onBearOffClick,
}) => {
  // Traditional Georgian board points mapping:
  // Left wing (Court 1):
  // Top: Points 13..18 (left to right) -> Indices [12, 13, 14, 15, 16, 17]
  // Bottom: Points 12..7 (left to right) -> Indices [11, 10, 9, 8, 7, 6]
  //
  // Right wing (Court 2):
  // Top: Points 19..24 (left to right) -> Indices [18, 19, 20, 21, 22, 23]
  // Bottom: Points 6..1 (left to right) -> Indices [5, 4, 3, 2, 1, 0]

  const leftTopIndices = [12, 13, 14, 15, 16, 17];
  const leftBottomIndices = [11, 10, 9, 8, 7, 6];
  const rightTopIndices = [18, 19, 20, 21, 22, 23];
  const rightBottomIndices = [5, 4, 3, 2, 1, 0];

  const canBearOffActive = legalTargets.includes(-99);

  const handleDragStart = (e: React.DragEvent, point: number | 'BAR') => {
    e.dataTransfer.setData('text/plain', point.toString());
    onPointClick(point);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetPoint: number | 'BAR' | 'OFF') => {
    e.preventDefault();
    if (targetPoint === 'OFF') {
      if (canBearOffActive) {
        onBearOffClick();
      }
    } else if (typeof targetPoint === 'number') {
      onPointClick(targetPoint);
    }
  };

  // Authentic Georgian Turned Wooden Checker (with concentric lathe grooves)
  const renderChecker = (
    owner: Player,
    isTop: boolean,
    index: number,
    totalCount: number,
    isLocked: boolean,
    isHinted: boolean,
    isMovableTopChecker: boolean,
    isSelectedTopChecker: boolean
  ) => {
    const isWhite = owner === 'WHITE';
    const isTopOfStack = index === Math.min(totalCount, 5) - 1;

    return (
      <div
        key={index}
        className={`w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full relative flex items-center justify-center transition-transform duration-150 select-none ${
          isWhite
            ? 'bg-gradient-to-br from-[#ffffff] via-[#f7f1e5] to-[#dccab0] border-2 border-[#b09b7e] shadow-[0_4px_8px_rgba(0,0,0,0.55),inset_0_2px_4px_rgba(255,255,255,0.95)] text-[#3b2a1a]'
            : 'bg-gradient-to-br from-[#593e2e] via-[#382214] to-[#1a0d06] border-2 border-[#704d37] shadow-[0_4px_8px_rgba(0,0,0,0.75),inset_0_2px_3px_rgba(255,255,255,0.22)] text-[#e8dacb]'
        } ${isHinted ? 'ring-4 ring-yellow-400 animate-pulse' : ''} ${
          isLocked ? 'ring-2 ring-red-500' : ''
        } ${
          isSelectedTopChecker
            ? 'ring-4 ring-amber-400 scale-105 shadow-[0_0_16px_rgba(251,191,36,0.85)]'
            : isMovableTopChecker
            ? 'group-hover:scale-105 group-hover:ring-2 group-hover:ring-amber-300/80'
            : ''
        }`}
        style={{
          marginTop: isTop && index > 0 ? '-1.45rem' : '0',
          marginBottom: !isTop && index > 0 ? '-1.45rem' : '0',
          zIndex: index + 2,
        }}
      >
        {/* Lathe concentric wood-rings identical to the kiwo.ge photo */}
        <div
          className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center opacity-75 ${
            isWhite ? 'border-[#bfa888]' : 'border-[#8a6245]'
          }`}
        >
          <div
            className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border flex items-center justify-center ${
              isWhite ? 'border-[#bfa888] bg-[#efe3d2]' : 'border-[#785338] bg-[#29170c]'
            }`}
          >
            <div
              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                isWhite ? 'bg-[#a88e6b]' : 'bg-[#9c7252]'
              }`}
            />
          </div>
        </div>

        {/* Home Hit Lock Indicator */}
        {isLocked && isTopOfStack && (
          <Lock className="w-4 h-4 text-red-500 animate-bounce absolute z-20" strokeWidth={3} />
        )}

        {/* Stack count badge for 6+ checkers (always on the innermost free checker!) */}
        {isTopOfStack && totalCount > 5 && (
          <span className="absolute text-[10px] sm:text-[11px] font-black bg-black/85 text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-400/70 shadow z-20">
            {totalCount}
          </span>
        )}
      </div>
    );
  };

  // Authentic Georgian Spearhead Point (ისარი) matching kiwo.ge arch curve
  const renderPoint = (pointIdx: number, isTop: boolean, quadrantPos: number, colIndex: number) => {
    const point = board.points[pointIdx];
    const isSelected = selectedPoint === pointIdx;
    const isLegalTarget = legalTargets.includes(pointIdx);
    const isLocked = lockedHomeHitPoints.includes(pointIdx);
    const isMovable = movableSourcePoints.includes(pointIdx);
    const isHintTargetPoint = hintTarget === pointIdx;
    const isHintSourcePoint = hintSource === pointIdx;

    const visibleCheckersCount = Math.min(point.count, 5);
    const displayNum = showPointNumbers ? quadrantPos : pointIdx + 1;

    // Subtle arch curve matching kiwo.ge spearheads around the central oval medallion
    // Columns 0 and 5 (edges) extend deeper toward center; columns 2 and 3 (middle) curve around the medallion
    const archTipLengths = [196, 184, 172, 172, 184, 196];
    const archBaseOffsets = [32, 26, 22, 22, 26, 32];
    const tipDist = archTipLengths[colIndex] || 185;
    const baseCy = isTop ? archBaseOffsets[colIndex] : 220 - archBaseOffsets[colIndex];
    const tipY = isTop ? tipDist : 220 - tipDist;

    return (
      <div
        key={pointIdx}
        onClick={() => onPointClick(pointIdx)}
        onDoubleClick={() => onPointDoubleClick(pointIdx)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, pointIdx)}
        className={`relative flex-1 h-40 sm:h-48 md:h-52 flex items-center cursor-pointer group transition-colors ${
          isTop ? 'flex-col justify-start' : 'flex-col-reverse justify-start'
        }`}
      >
        {/* Scalloped Arch Carved Into Top/Bottom Rail (კივოს დაფის ტალღოვანი ბუდე) */}
        <div
          className={`absolute inset-x-0.5 h-6 sm:h-7 bg-gradient-to-b from-[#b8864e]/45 to-[#d8ad75]/15 border-x border-[#7a4e25]/35 pointer-events-none ${
            isTop
              ? 'top-0 rounded-b-full border-b border-[#7a4e25]/40 shadow-[inset_0_3px_6px_rgba(0,0,0,0.35)]'
              : 'bottom-0 rounded-t-full border-t border-[#7a4e25]/40 shadow-[inset_0_-3px_6px_rgba(0,0,0,0.35)]'
          }`}
        />

        {/* Authentic Georgian Spearhead Point SVG (Painted on Wood Surface z-0) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          preserveAspectRatio="none"
          viewBox="0 0 60 220"
        >
          {isTop ? (
            <g>
              {/* Spearhead Body */}
              <polygon
                points={`16,${baseCy} 44,${baseCy} 30,${tipY}`}
                fill="#1a110b"
                stroke="#120a06"
                strokeWidth="1"
              />
              {/* Base Circle with Number */}
              <circle cx="30" cy={baseCy} r="14" fill="#1a110b" stroke="#2e1a0e" strokeWidth="1" />
              <circle
                cx="30"
                cy={baseCy}
                r="9.5"
                fill="#e2b982"
                stroke="#1a110b"
                strokeWidth="1"
              />
              <text
                x="30"
                y={baseCy + 4}
                textAnchor="middle"
                fill="#1a110b"
                fontSize="11"
                fontWeight="900"
                fontFamily="serif"
              >
                {displayNum}
              </text>

              {/* Decorative inner marquetry diamond chain (◊-◊-◊-◊) */}
              <polygon
                points={`30,${baseCy + 20} 33.5,${baseCy + 28} 30,${baseCy + 36} 26.5,${baseCy + 28}`}
                fill="none"
                stroke="#d8ad75"
                strokeWidth="1.3"
              />
              <polygon
                points={`30,${baseCy + 42} 33,${baseCy + 50} 30,${baseCy + 58} 27,${baseCy + 50}`}
                fill="none"
                stroke="#d8ad75"
                strokeWidth="1.2"
              />
              <polygon
                points={`30,${baseCy + 64} 32.5,${baseCy + 71} 30,${baseCy + 78} 27.5,${baseCy + 71}`}
                fill="none"
                stroke="#d8ad75"
                strokeWidth="1.1"
              />
              <polygon
                points={`30,${baseCy + 84} 32,${baseCy + 90} 30,${baseCy + 96} 28,${baseCy + 90}`}
                fill="none"
                stroke="#d8ad75"
                strokeWidth="1"
              />
              <line
                x1="30"
                y1={baseCy + 98}
                x2="30"
                y2={tipY - 14}
                stroke="#d8ad75"
                strokeWidth="1"
                opacity="0.85"
              />
            </g>
          ) : (
            <g>
              {/* Spearhead Body */}
              <polygon
                points={`16,${baseCy} 44,${baseCy} 30,${tipY}`}
                fill="#1a110b"
                stroke="#120a06"
                strokeWidth="1"
              />
              {/* Base Circle with Number */}
              <circle cx="30" cy={baseCy} r="14" fill="#1a110b" stroke="#2e1a0e" strokeWidth="1" />
              <circle
                cx="30"
                cy={baseCy}
                r="9.5"
                fill="#e2b982"
                stroke="#1a110b"
                strokeWidth="1"
              />
              <text
                x="30"
                y={baseCy + 4}
                textAnchor="middle"
                fill="#1a110b"
                fontSize="11"
                fontWeight="900"
                fontFamily="serif"
              >
                {displayNum}
              </text>

              {/* Decorative inner marquetry diamond chain (◊-◊-◊-◊) */}
              <polygon
                points={`30,${baseCy - 20} 33.5,${baseCy - 28} 30,${baseCy - 36} 26.5,${baseCy - 28}`}
                fill="none"
                stroke="#d8ad75"
                strokeWidth="1.3"
              />
              <polygon
                points={`30,${baseCy - 42} 33,${baseCy - 50} 30,${baseCy - 58} 27,${baseCy - 50}`}
                fill="none"
                stroke="#d8ad75"
                strokeWidth="1.2"
              />
              <polygon
                points={`30,${baseCy - 64} 32.5,${baseCy - 71} 30,${baseCy - 78} 27.5,${baseCy - 71}`}
                fill="none"
                stroke="#d8ad75"
                strokeWidth="1.1"
              />
              <polygon
                points={`30,${baseCy - 84} 32,${baseCy - 90} 30,${baseCy - 96} 28,${baseCy - 90}`}
                fill="none"
                stroke="#d8ad75"
                strokeWidth="1"
              />
              <line
                x1="30"
                y1={baseCy - 98}
                x2="30"
                y2={tipY + 14}
                stroke="#d8ad75"
                strokeWidth="1"
                opacity="0.85"
              />
            </g>
          )}
        </svg>

        {/* Green Glowing Circle for Legal Target */}
        {isLegalTarget && (
          <div
            className={`absolute inset-x-0 z-30 flex items-center justify-center pointer-events-none ${
              isTop ? 'bottom-3' : 'top-3'
            }`}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500/80 ring-4 ring-emerald-300 animate-ping" />
            <div className="absolute w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-400 border-2 border-white shadow-lg" />
          </div>
        )}

        {/* Selected Highlight */}
        {isSelected && (
          <div className="absolute inset-0 z-10 border-2 border-amber-500 bg-amber-400/20 rounded-lg pointer-events-none shadow-[inset_0_0_15px_rgba(251,191,36,0.5)]" />
        )}

        {/* Direct Floating Bear-Off Button when this selected checker can bear off! */}
        {isSelected && canBearOffActive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBearOffClick();
            }}
            className={`absolute ${
              isTop ? 'bottom-1' : 'top-1'
            } z-40 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] sm:text-xs font-black px-2 py-1 rounded-full shadow-xl border-2 border-white flex items-center gap-0.5 animate-bounce`}
          >
            <span>გადაყრა</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Hint Callout */}
        {isHintTargetPoint && (
          <div className="absolute z-30 top-1/2 transform -translate-y-1/2 flex items-center gap-1 bg-yellow-400 text-black text-xs font-black px-2 py-0.5 rounded shadow-lg animate-bounce">
            <Sparkles className="w-3.5 h-3.5" /> სვლა
          </div>
        )}

        {/* Checkers Stack: flex-col for top, flex-col-reverse for bottom so index 0 is ALWAYS against the outer wall! */}
        <div
          draggable={point.owner === turn && !isLocked && isMovable}
          onDragStart={(e) => handleDragStart(e, pointIdx)}
          className={`relative z-10 flex items-center ${
            isTop ? 'flex-col pt-1' : 'flex-col-reverse pb-1'
          }`}
        >
          {point.owner &&
            Array.from({ length: visibleCheckersCount }).map((_, i) =>
              renderChecker(
                point.owner!,
                isTop,
                i,
                point.count,
                isLocked,
                isHintSourcePoint && i === visibleCheckersCount - 1,
                isMovable && i === visibleCheckersCount - 1,
                isSelected && i === visibleCheckersCount - 1
              )
            )}
        </div>

        {/* Global Point Index Tooltip (1..24) on hover */}
        <span
          className={`absolute ${
            isTop ? 'bottom-0.5' : 'top-0.5'
          } text-[9px] font-mono font-bold text-[#5c3717]/60 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20`}
        >
          #{pointIdx + 1}
        </span>

        {/* Locked Home Hit Warning Badge */}
        {isLocked && (
          <div
            className={`absolute ${
              isTop ? 'bottom-2' : 'top-2'
            } z-30 bg-red-950/95 text-red-200 border border-red-500 px-1.5 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-0.5 shadow-lg`}
          >
            <Lock className="w-2.5 h-2.5 text-red-400" /> ღია
          </div>
        )}
      </div>
    );
  };

  // Renders miniature realistic 3D die on the wooden board court (just like kiwo.ge photo!)
  const renderOnBoardDie = (val: number, idx: number, isUsed: boolean) => {
    const pips: Record<number, number[]> = {
      1: [4],
      2: [2, 6],
      3: [2, 4, 6],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };
    const active = pips[val] || [];
    const rotation = idx === 0 ? '-rotate-6' : 'rotate-12';

    return (
      <div
        key={idx}
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-white via-[#f8f4ec] to-[#d9cebe] border border-[#8c785c] shadow-[0_4px_8px_rgba(0,0,0,0.6)] p-1 grid grid-cols-3 grid-rows-3 transition-all ${rotation} ${
          isRolling ? 'animate-spin' : ''
        } ${isUsed ? 'opacity-35 scale-90' : 'opacity-100'}`}
      >
        {Array.from({ length: 9 }).map((_, dotIdx) => (
          <div key={dotIdx} className="flex items-center justify-center">
            {active.includes(dotIdx) && (
              <div
                className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${
                  val === 1 ? 'bg-red-700' : 'bg-[#1a110b]'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  // Traditional Georgian Central Floral Palmette Medallion (კივოს ნარდის ორნამენტი)
  const renderCentralMedallion = (showDiceHere: boolean) => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <svg viewBox="0 0 220 290" className="w-36 sm:w-44 md:w-52 h-auto opacity-90">
        {/* Outer Thick Oval Ring */}
        <ellipse
          cx="110"
          cy="145"
          rx="86"
          ry="122"
          fill="none"
          stroke="#1a110b"
          strokeWidth="6.5"
        />
        {/* Inner Thin Oval Ring */}
        <ellipse
          cx="110"
          cy="145"
          rx="74"
          ry="110"
          fill="none"
          stroke="#1a110b"
          strokeWidth="2.5"
        />

        {/* Top Georgian Fleur-de-Lis / Palmette */}
        <g transform="translate(110, 86)">
          {/* Central Diamond Spear */}
          <path d="M 0,-50 L 14,-24 L 0,2 L -14,-24 Z" fill="#1a110b" />
          <path d="M 0,-38 L 7,-24 L 0,-10 L -7,-24 Z" fill="#e6be8a" />
          {/* Left & Right Curved Petals */}
          <path
            d="M -6,-12 C -22,-32 -44,-22 -40,-2 C -37,12 -18,12 -12,2 C -22,2 -28,-6 -24,-14 C -20,-20 -10,-16 -6,-6 Z"
            fill="#1a110b"
          />
          <path
            d="M 6,-12 C 22,-32 44,-22 40,-2 C 37,12 18,12 12,2 C 22,2 28,-6 24,-14 C 20,-20 10,-16 6,-6 Z"
            fill="#1a110b"
          />
          {/* Collar Band & Base Trifoil */}
          <rect x="-18" y="4" width="36" height="5.5" rx="2" fill="#1a110b" />
          <path
            d="M -16,12 C -22,22 -14,30 -6,22 L 0,32 L 6,22 C 14,30 22,22 16,12 Z"
            fill="#1a110b"
          />
        </g>

        {/* Bottom Mirrored Georgian Fleur-de-Lis / Palmette */}
        <g transform="translate(110, 204) scale(1, -1)">
          <path d="M 0,-50 L 14,-24 L 0,2 L -14,-24 Z" fill="#1a110b" />
          <path d="M 0,-38 L 7,-24 L 0,-10 L -7,-24 Z" fill="#e6be8a" />
          <path
            d="M -6,-12 C -22,-32 -44,-22 -40,-2 C -37,12 -18,12 -12,2 C -22,2 -28,-6 -24,-14 C -20,-20 -10,-16 -6,-6 Z"
            fill="#1a110b"
          />
          <path
            d="M 6,-12 C 22,-32 44,-22 40,-2 C 37,12 18,12 12,2 C 22,2 28,-6 24,-14 C 20,-20 10,-16 6,-6 Z"
            fill="#1a110b"
          />
          <rect x="-18" y="4" width="36" height="5.5" rx="2" fill="#1a110b" />
          <path
            d="M -16,12 C -22,22 -14,30 -6,22 L 0,32 L 6,22 C 14,30 22,22 16,12 Z"
            fill="#1a110b"
          />
        </g>

        {/* Left & Right Small Side Fleur-de-Lis Flourishes */}
        <g transform="translate(55, 145) scale(0.55)">
          <path
            d="M -25,0 L 0,-12 L 25,0 L 0,12 Z M -10,-18 C 0,-8 10,-8 18,-18 M -10,18 C 0,8 10,8 18,18"
            fill="#1a110b"
            stroke="#1a110b"
            strokeWidth="4"
          />
        </g>
        <g transform="translate(165, 145) scale(0.55)">
          <path
            d="M -25,0 L 0,-12 L 25,0 L 0,12 Z M -10,-18 C 0,-8 10,-8 18,-18 M -10,18 C 0,8 10,8 18,18"
            fill="#1a110b"
            stroke="#1a110b"
            strokeWidth="4"
          />
        </g>
      </svg>

      {/* Rolled Dice Resting Right Inside the Medallion Court (like the kiwo.ge photo!) */}
      {showDiceHere && dice && (
        <div className="absolute z-20 flex items-center gap-3 transform translate-x-4 translate-y-1">
          {renderOnBoardDie(dice[0], 0, !diceRemaining.includes(dice[0]))}
          {renderOnBoardDie(
            dice[1],
            1,
            dice[0] === dice[1]
              ? diceRemaining.length < 2
              : !diceRemaining.includes(dice[1])
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="relative w-full max-w-4xl mx-auto select-none px-1">
      {/* Handcrafted Natural Georgian Wooden Case (ნარდის ნატურალური ხის ყუთი) */}
      <div className="p-2 sm:p-3 md:p-4 rounded-2xl bg-gradient-to-br from-[#c99b68] via-[#dfb685] to-[#b0804d] border-[6px] sm:border-[10px] border-[#8c5f32] shadow-[0_24px_60px_rgba(0,0,0,0.85),inset_0_2px_8px_rgba(255,255,255,0.45)] relative">
        {/* Inner Playing Board - Two Symmetrical Wooden Wings */}
        <div className="relative flex rounded-xl bg-[#e6be8a] border-4 border-[#6e441f] shadow-[inset_0_4px_25px_rgba(0,0,0,0.45)] overflow-hidden">
          {/* ================= LEFT WING (COURT 1) ================= */}
          <div
            className="flex-1 relative flex flex-col justify-between gap-10 sm:gap-14 md:gap-16 p-1 sm:p-2 bg-gradient-to-b from-[#dfB47c] via-[#eac593] to-[#dfB47c]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, rgba(120,72,30,0.04) 0px, rgba(120,72,30,0.04) 2px, transparent 2px, transparent 8px)',
            }}
          >
            {/* Central Oval Georgian Ornament (Shows dice when WHITE is rolling/playing) */}
            {renderCentralMedallion(turn === 'WHITE')}

            {/* Left Top Points (13..18 -> labeled 6..1 in circle) */}
            <div className="relative z-10 flex w-full">
              {leftTopIndices.map((idx, pos) => renderPoint(idx, true, 6 - pos, pos))}
            </div>

            {/* Left Bottom Points (12..7 -> labeled 1..6 in circle) */}
            <div className="relative z-10 flex w-full">
              {leftBottomIndices.map((idx, pos) => renderPoint(idx, false, pos + 1, pos))}
            </div>
          </div>

          {/* ================= CENTRAL WOODEN HINGE BAR (შუა ხარი) ================= */}
          <div className="w-9 sm:w-12 md:w-14 bg-gradient-to-r from-[#b58450] via-[#d4a572] to-[#b58450] border-x-4 border-[#6e441f] flex flex-col items-center justify-between py-6 relative shadow-[0_0_15px_rgba(0,0,0,0.5)] z-20">
            {/* Center Folding Seam Line */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-[#4a2c11]/70 pointer-events-none" />

            {/* Top Metallic Hinge (ანჯამა — კივოს ფოტოს სტილში) */}
            <div className="relative z-10 w-6 sm:w-7 h-8 bg-gradient-to-b from-[#d8d4c8] via-[#b8b2a2] to-[#8c8576] rounded-sm border border-[#4a443b] shadow-md flex flex-col items-center justify-between p-1">
              <div className="flex justify-between w-full">
                <div className="w-1 h-1 rounded-full bg-[#332f29]" />
                <div className="w-1 h-1 rounded-full bg-[#332f29]" />
              </div>
              <div className="w-full h-0.5 bg-[#4a443b]" />
              <div className="flex justify-between w-full">
                <div className="w-1 h-1 rounded-full bg-[#332f29]" />
                <div className="w-1 h-1 rounded-full bg-[#332f29]" />
              </div>
            </div>

            {/* Checkers on the BAR (Captured Checkers) */}
            <div className="relative z-10 flex flex-col items-center gap-4 my-auto">
              {/* White Bar */}
              {board.bar.WHITE > 0 && (
                <div
                  onClick={() => onPointClick('BAR')}
                  onDoubleClick={() => onPointDoubleClick('BAR')}
                  draggable={turn === 'WHITE'}
                  onDragStart={(e) => handleDragStart(e, 'BAR')}
                  className={`cursor-pointer relative ${
                    selectedPoint === 'BAR' ? 'ring-4 ring-amber-400 rounded-full scale-105' : ''
                  }`}
                  title="თეთრი ქვა ბარზე (დააჭირე შესაყვანად)"
                >
                  {renderChecker(
                    'WHITE',
                    true,
                    0,
                    board.bar.WHITE,
                    false,
                    hintSource === 'BAR',
                    movableSourcePoints.includes('BAR'),
                    selectedPoint === 'BAR'
                  )}
                  {board.bar.WHITE > 1 && (
                    <span className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 rounded-full shadow z-30">
                      +{board.bar.WHITE}
                    </span>
                  )}
                </div>
              )}

              {/* Black Bar */}
              {board.bar.BLACK > 0 && (
                <div
                  onClick={() => onPointClick('BAR')}
                  onDoubleClick={() => onPointDoubleClick('BAR')}
                  draggable={turn === 'BLACK'}
                  onDragStart={(e) => handleDragStart(e, 'BAR')}
                  className={`cursor-pointer relative ${
                    selectedPoint === 'BAR' ? 'ring-4 ring-amber-400 rounded-full scale-105' : ''
                  }`}
                  title="შავი ქვა ბარზე (დააჭირე შესაყვანად)"
                >
                  {renderChecker(
                    'BLACK',
                    false,
                    0,
                    board.bar.BLACK,
                    false,
                    hintSource === 'BAR',
                    movableSourcePoints.includes('BAR'),
                    selectedPoint === 'BAR'
                  )}
                  {board.bar.BLACK > 1 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 rounded-full shadow z-30">
                      +{board.bar.BLACK}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Metallic Hinge (ანჯამა) */}
            <div className="relative z-10 w-6 sm:w-7 h-8 bg-gradient-to-b from-[#d8d4c8] via-[#b8b2a2] to-[#8c8576] rounded-sm border border-[#4a443b] shadow-md flex flex-col items-center justify-between p-1">
              <div className="flex justify-between w-full">
                <div className="w-1 h-1 rounded-full bg-[#332f29]" />
                <div className="w-1 h-1 rounded-full bg-[#332f29]" />
              </div>
              <div className="w-full h-0.5 bg-[#4a443b]" />
              <div className="flex justify-between w-full">
                <div className="w-1 h-1 rounded-full bg-[#332f29]" />
                <div className="w-1 h-1 rounded-full bg-[#332f29]" />
              </div>
            </div>
          </div>

          {/* ================= RIGHT WING (COURT 2) ================= */}
          <div
            className="flex-1 relative flex flex-col justify-between gap-10 sm:gap-14 md:gap-16 p-1 sm:p-2 bg-gradient-to-b from-[#dfB47c] via-[#eac593] to-[#dfB47c]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, rgba(120,72,30,0.04) 0px, rgba(120,72,30,0.04) 2px, transparent 2px, transparent 8px)',
            }}
          >
            {/* Central Oval Georgian Ornament (Shows dice when BLACK is rolling/playing) */}
            {renderCentralMedallion(turn === 'BLACK')}

            {/* Right Top Points (19..24 - Black Home -> labeled 6..1 in circle) */}
            <div className="relative z-10 flex w-full">
              {rightTopIndices.map((idx, pos) => renderPoint(idx, true, 6 - pos, pos))}
            </div>

            {/* Right Bottom Points (6..1 - White Home -> labeled 1..6 in circle) */}
            <div className="relative z-10 flex w-full">
              {rightBottomIndices.map((idx, pos) => renderPoint(idx, false, pos + 1, pos))}
            </div>
          </div>
        </div>

        {/* Bottom Gutter Bar for Bear-Off Trays (ქვების გადაყრის პანელი ორივე მოთამაშისთვის) */}
        <div className="mt-2 pt-2 border-t border-[#7a4e25]/40 flex flex-wrap items-center justify-between gap-2 px-2 text-xs font-bold text-[#3b200c]">
          {/* Black Borne Off indicator & Bear-Off Zone (for Pass & Play) */}
          <div
            onClick={() => {
              if (turn === 'BLACK' && canBearOffActive) onBearOffClick();
            }}
            onDragOver={handleDragOver}
            onDrop={(e) => {
              if (turn === 'BLACK') handleDrop(e, 'OFF');
            }}
            className={`flex items-center gap-2 px-3 py-1 rounded-xl transition ${
              turn === 'BLACK' && canBearOffActive
                ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-300 animate-bounce cursor-pointer'
                : 'bg-[#2a1608] text-amber-200 border border-[#5c3a1b]'
            }`}
          >
            <span>⚫ შავის გადაყვანილი:</span>
            <span className="font-extrabold text-sm">{board.borneOff.BLACK} / 15</span>
            {turn === 'BLACK' && canBearOffActive && (
              <span className="bg-white text-emerald-800 text-[10px] font-black px-1.5 py-0.5 rounded">
                გადაყრა!
              </span>
            )}
          </div>

          <div className="text-[11px] text-[#4a2b11]/80 font-semibold hidden md:block">
            💡 ორმაგი წკაპი ქვაზე — სწრაფი სვლა • Space — გაგორება / დადასტურება
          </div>

          {/* White Bear-Off Button / Drop Zone */}
          <div
            onClick={() => {
              if (turn === 'WHITE' && canBearOffActive) onBearOffClick();
            }}
            onDragOver={handleDragOver}
            onDrop={(e) => {
              if (turn === 'WHITE') handleDrop(e, 'OFF');
            }}
            className={`flex items-center gap-2 px-3 py-1 rounded-xl transition ${
              turn === 'WHITE' && canBearOffActive
                ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-300 animate-bounce cursor-pointer'
                : 'bg-[#5c3516] text-amber-100 border border-[#804f26]'
            }`}
          >
            <span>⚪ თეთრის გადაყვანილი:</span>
            <span className="font-extrabold text-sm">{board.borneOff.WHITE} / 15</span>
            {turn === 'WHITE' && canBearOffActive && (
              <span className="bg-white text-emerald-800 text-[10px] font-black px-1.5 py-0.5 rounded">
                გადაყრა!
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
