import React, { useState, useRef, useCallback } from 'react';
import { BoardState, Player } from '../engine/types';
import { BoardThemeId, BOARD_THEMES } from '../engine/themes';
import { Lock, Sparkles, ArrowUpRight, Zap } from 'lucide-react';
import { Dice3DPair } from './Dice3D';
import { haptics } from '../audio/haptics';

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
  rollKey?: number;
  canRoll?: boolean;
  themeId?: BoardThemeId;
  isAutoPlay?: boolean;
  canBearOffPhase?: boolean;
  onToggleAutoPlay?: () => void;
  onRoll?: () => void;
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
  rollKey = 0,
  canRoll = false,
  themeId = 'CLASSIC_WALNUT',
  isAutoPlay = false,
  canBearOffPhase = false,
  onToggleAutoPlay,
  onRoll,
  onPointClick,
  onPointDoubleClick,
  onBearOffClick,
}) => {
  const theme = BOARD_THEMES[themeId] || BOARD_THEMES.CLASSIC_WALNUT;
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

  // Touch & Pointer Drag-and-Drop state
  const [dragState, setDragState] = useState<{
    source: number | 'BAR';
    owner: Player;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    hasMoved: boolean;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Handle pointer down on movable checker
  const handlePointerDownChecker = (
    e: React.PointerEvent,
    source: number | 'BAR',
    owner: Player
  ) => {
    // Only moving player can drag their own checkers
    if (owner !== turn) return;
    if (!movableSourcePoints.includes(source)) return;

    // Capture pointer
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    setDragState({
      source,
      owner,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      hasMoved: false,
    });
  };

  const handlePointerMoveChecker = (e: React.PointerEvent) => {
    if (!dragState) return;

    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 8 || dragState.hasMoved) {
      if (!dragState.hasMoved) {
        haptics.trigger('selection');
      }
      setDragState((prev) =>
        prev
          ? {
              ...prev,
              currentX: e.clientX,
              currentY: e.clientY,
              hasMoved: true,
            }
          : null
      );
    }
  };

  const handlePointerUpChecker = (e: React.PointerEvent) => {
    if (!dragState) return;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (dragState.hasMoved) {
      // Drag & drop drop check using elementFromPoint
      const elementsUnder = document.elementsFromPoint(e.clientX, e.clientY);
      let droppedOnTarget: number | 'OFF' | null = null;

      for (const el of elementsUnder) {
        const pointAttr = el.getAttribute('data-point-idx');
        if (pointAttr !== null) {
          droppedOnTarget = parseInt(pointAttr, 10);
          break;
        }
        if (el.getAttribute('data-bear-off-zone') !== null) {
          droppedOnTarget = 'OFF';
          break;
        }
      }

      if (droppedOnTarget === 'OFF' && canBearOffActive) {
        onBearOffClick();
        haptics.trigger('light');
      } else if (typeof droppedOnTarget === 'number' && legalTargets.includes(droppedOnTarget)) {
        onPointClick(droppedOnTarget);
        haptics.trigger('light');
      } else {
        // Canceled or invalid drop - just select source
        onPointClick(dragState.source);
      }
    } else {
      // Tap (no drag)
      onPointClick(dragState.source);
    }

    setDragState(null);
  };

  // Authentic Georgian Turned Wooden Checker
  const renderChecker = useCallback(
    (
      owner: Player,
      isTop: boolean,
      index: number,
      totalCount: number,
      isLocked: boolean,
      isHinted: boolean,
      isMovableTopChecker: boolean,
      isSelectedTopChecker: boolean,
      pointIdx: number | 'BAR'
    ) => {
      const isWhite = owner === 'WHITE';
      const checkerConfig = isWhite ? theme.checkers.white : theme.checkers.black;
      const isTopOfStack = index === Math.min(totalCount, 5) - 1;

      // Stacking offset calculation: checkers touch edge-to-edge and overlap with ZERO gaps!
      const visibleCount = Math.min(totalCount, 5);
      const stepMultiplier = visibleCount >= 5 ? 0.62 : visibleCount === 4 ? 0.67 : 0.72;
      const isBar = pointIdx === 'BAR';

      return (
        <div
          key={index}
          onPointerDown={(e) => {
            if (isTopOfStack && isMovableTopChecker) {
              e.stopPropagation();
              handlePointerDownChecker(e, pointIdx, owner);
            }
          }}
          onPointerMove={handlePointerMoveChecker}
          onPointerUp={handlePointerUpChecker}
          className={`w-[var(--checker-size,2rem)] h-[var(--checker-size,2rem)] rounded-full absolute left-1/2 -translate-x-1/2 flex items-center justify-center select-none ${
            isTopOfStack && isMovableTopChecker ? 'cursor-grab active:cursor-grabbing touch-none' : ''
          } ${checkerConfig.gradientClass} ${isHinted ? 'ring-2 sm:ring-4 ring-yellow-400 animate-pulse' : ''} ${
            isLocked ? 'ring-2 ring-red-500' : ''
          } ${
            isSelectedTopChecker
              ? 'ring-2 sm:ring-4 ring-amber-400 scale-105 shadow-[0_0_14px_rgba(251,191,36,0.85)] z-30'
              : ''
          }`}
          style={{
            top: isBar ? '0px' : isTop ? `calc(2px + ${index * stepMultiplier} * var(--checker-size, 2rem))` : undefined,
            bottom: isBar ? undefined : !isTop ? `calc(2px + ${index * stepMultiplier} * var(--checker-size, 2rem))` : undefined,
            zIndex: index + 5,
          }}
        >
          {/* Lathe concentric wood-rings */}
          <div
            className={`w-[70%] h-[70%] rounded-full border flex items-center justify-center opacity-75 ${checkerConfig.outerRingBorder}`}
          >
            <div
              className={`w-[60%] h-[60%] rounded-full border flex items-center justify-center ${checkerConfig.innerCircleBorder} ${checkerConfig.innerCircleBg}`}
            >
              <div
                className={`w-1 h-1 rounded-full ${checkerConfig.dotBg}`}
              />
            </div>
          </div>

          {/* Home Hit Lock Indicator */}
          {isLocked && isTopOfStack && (
            <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 animate-bounce absolute z-20" strokeWidth={3} />
          )}

          {/* Stack count badge for 6+ checkers */}
          {isTopOfStack && totalCount > 5 && (
            <span className="absolute text-[9px] sm:text-[10px] font-black bg-black/85 text-amber-300 px-1 rounded-full border border-amber-400/70 shadow z-20">
              {totalCount}
            </span>
          )}
        </div>
      );
    },
    [dragState, movableSourcePoints, turn, theme]
  );

  // Authentic Georgian Spearhead Point (ისარი)
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

    // Spearhead arch geometry
    const archTipLengths = [196, 184, 172, 172, 184, 196];
    const archBaseOffsets = [32, 26, 22, 22, 26, 32];
    const tipDist = archTipLengths[colIndex] || 185;
    const baseCy = isTop ? archBaseOffsets[colIndex] : 220 - archBaseOffsets[colIndex];
    const tipY = isTop ? tipDist : 220 - tipDist;

    return (
      <div
        key={pointIdx}
        data-point-idx={pointIdx}
        onClick={() => onPointClick(pointIdx)}
        onDoubleClick={() => onPointDoubleClick(pointIdx)}
        className={`relative w-full h-full flex flex-col items-center cursor-pointer select-none overflow-visible group ${
          isTop ? 'justify-start pt-1' : 'justify-end pb-1'
        }`}
      >
        {/* Scalloped Arch Carved Into Rail */}
        <div
          className={`absolute inset-x-0.5 h-4 sm:h-6 ${theme.pointSvg.scallopArchBg} border-x ${theme.pointSvg.scallopArchBorder} pointer-events-none ${
            isTop
              ? 'top-0 rounded-b-full border-b shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]'
              : 'bottom-0 rounded-t-full border-t shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3)]'
          }`}
        />

        {/* Spearhead Point SVG */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          preserveAspectRatio="none"
          viewBox="0 0 60 220"
        >
          {isTop ? (
            <g>
              <polygon
                points={`16,${baseCy} 44,${baseCy} 30,${tipY}`}
                fill={theme.pointSvg.baseFill}
                stroke={theme.pointSvg.baseStroke}
                strokeWidth="1"
              />
              <circle cx="30" cy={baseCy} r="13" fill={theme.pointSvg.outerCircleFill} stroke={theme.pointSvg.outerCircleStroke} strokeWidth="1" />
              <circle cx="30" cy={baseCy} r="9" fill={theme.pointSvg.innerCircleFill} stroke={theme.pointSvg.innerCircleStroke} strokeWidth="1" />
              <text
                x="30"
                y={baseCy + 3.5}
                textAnchor="middle"
                fill={theme.pointSvg.numberFill}
                fontSize="10"
                fontWeight="900"
                fontFamily="serif"
              >
                {displayNum}
              </text>
              <polygon
                points={`30,${baseCy + 18} 33,${baseCy + 25} 30,${baseCy + 32} 27,${baseCy + 25}`}
                fill="none"
                stroke={theme.pointSvg.filigreeStroke}
                strokeWidth="1.2"
              />
              <polygon
                points={`30,${baseCy + 38} 32.5,${baseCy + 45} 30,${baseCy + 52} 27.5,${baseCy + 45}`}
                fill="none"
                stroke={theme.pointSvg.filigreeStroke}
                strokeWidth="1.1"
              />
              <line
                x1="30"
                y1={baseCy + 56}
                x2="30"
                y2={tipY - 12}
                stroke={theme.pointSvg.filigreeStroke}
                strokeWidth="1"
                opacity={theme.pointSvg.filigreeOpacity}
              />
            </g>
          ) : (
            <g>
              <polygon
                points={`16,${baseCy} 44,${baseCy} 30,${tipY}`}
                fill={theme.pointSvg.baseFill}
                stroke={theme.pointSvg.baseStroke}
                strokeWidth="1"
              />
              <circle cx="30" cy={baseCy} r="13" fill={theme.pointSvg.outerCircleFill} stroke={theme.pointSvg.outerCircleStroke} strokeWidth="1" />
              <circle cx="30" cy={baseCy} r="9" fill={theme.pointSvg.innerCircleFill} stroke={theme.pointSvg.innerCircleStroke} strokeWidth="1" />
              <text
                x="30"
                y={baseCy + 3.5}
                textAnchor="middle"
                fill={theme.pointSvg.numberFill}
                fontSize="10"
                fontWeight="900"
                fontFamily="serif"
              >
                {displayNum}
              </text>
              <polygon
                points={`30,${baseCy - 18} 33,${baseCy - 25} 30,${baseCy - 32} 27,${baseCy - 25}`}
                fill="none"
                stroke={theme.pointSvg.filigreeStroke}
                strokeWidth="1.2"
              />
              <polygon
                points={`30,${baseCy - 38} 32.5,${baseCy - 45} 30,${baseCy - 52} 27.5,${baseCy - 45}`}
                fill="none"
                stroke={theme.pointSvg.filigreeStroke}
                strokeWidth="1.1"
              />
              <line
                x1="30"
                y1={baseCy - 56}
                x2="30"
                y2={tipY + 12}
                stroke={theme.pointSvg.filigreeStroke}
                strokeWidth="1"
                opacity={theme.pointSvg.filigreeOpacity}
              />
            </g>
          )}
        </svg>

        {/* Legal Target Indicator */}
        {isLegalTarget && (
          <div
            className={`absolute inset-x-0 z-30 flex items-center justify-center pointer-events-none ${
              isTop ? 'bottom-2' : 'top-2'
            }`}
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-emerald-500/80 ring-2 ring-emerald-300 animate-ping" />
            <div className="absolute w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-400 border border-white shadow-md" />
          </div>
        )}

        {/* Selected Highlight */}
        {isSelected && (
          <div className="absolute inset-0 z-10 border-2 border-amber-500 bg-amber-400/20 rounded-md pointer-events-none shadow-[inset_0_0_12px_rgba(251,191,36,0.5)]" />
        )}

        {/* Direct Bear-Off Quick Button */}
        {isSelected && canBearOffActive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBearOffClick();
            }}
            className={`absolute ${
              isTop ? 'bottom-1' : 'top-1'
            } z-40 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] sm:text-xs font-black px-1.5 py-0.5 rounded-full shadow-lg border border-white flex items-center gap-0.5`}
          >
            <span>გადაყრა</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        )}

        {/* Hint Callout */}
        {isHintTargetPoint && (
          <div className="absolute z-30 top-1/2 transform -translate-y-1/2 flex items-center gap-0.5 bg-yellow-400 text-black text-[10px] sm:text-xs font-black px-1.5 py-0.5 rounded shadow-lg">
            <Sparkles className="w-3 h-3" /> სვლა
          </div>
        )}

        {/* Checkers Stack Container (Position absolute inside point, height locked) */}
        <div className="absolute inset-0 z-10 pointer-events-none">
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
                isSelected && i === visibleCheckersCount - 1,
                pointIdx
              )
            )}
        </div>

        {/* Locked Home Hit Warning Badge */}
        {isLocked && (
          <div
            className={`absolute ${
              isTop ? 'bottom-1.5' : 'top-1.5'
            } z-30 bg-red-950/95 text-red-200 border border-red-500 px-1 py-0.5 rounded text-[8px] font-bold flex items-center gap-0.5 shadow`}
          >
            <Lock className="w-2.5 h-2.5 text-red-400" /> ღია
          </div>
        )}
      </div>
    );
  };

  // Traditional Georgian Central Floral Palmette Medallion
  const renderCentralMedallion = (showDiceHere: boolean) => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <svg viewBox="0 0 220 290" className={`w-28 sm:w-40 md:w-48 h-auto ${theme.medallionSvg.opacity}`}>
        <ellipse cx="110" cy="145" rx="86" ry="122" fill="none" stroke={theme.medallionSvg.outerRingStroke} strokeWidth="6" />
        <ellipse cx="110" cy="145" rx="74" ry="110" fill="none" stroke={theme.medallionSvg.innerRingStroke} strokeWidth="2" />

        {/* Top Palmette */}
        <g transform="translate(110, 86)">
          <path d="M 0,-50 L 14,-24 L 0,2 L -14,-24 Z" fill={theme.medallionSvg.primaryFill} />
          <path d="M 0,-38 L 7,-24 L 0,-10 L -7,-24 Z" fill={theme.medallionSvg.accentFill} />
          <rect x="-18" y="4" width="36" height="5.5" rx="2" fill={theme.medallionSvg.primaryFill} />
        </g>
        {/* Bottom Palmette */}
        <g transform="translate(110, 204) scale(1, -1)">
          <path d="M 0,-50 L 14,-24 L 0,2 L -14,-24 Z" fill={theme.medallionSvg.primaryFill} />
          <path d="M 0,-38 L 7,-24 L 0,-10 L -7,-24 Z" fill={theme.medallionSvg.accentFill} />
          <rect x="-18" y="4" width="36" height="5.5" rx="2" fill={theme.medallionSvg.primaryFill} />
        </g>
      </svg>

      {/* Floating Interactive Dice Roll Button on Active Court */}
      {showDiceHere && canRoll && !isRolling && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            (e.currentTarget as HTMLElement).blur();
            onRoll?.();
          }}
          className="absolute z-30 pointer-events-auto px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 text-white font-black text-xs sm:text-sm shadow-[0_0_18px_rgba(217,119,6,0.7)] border border-amber-200/70 flex items-center gap-1 active:scale-95 transition"
        >
          <span className="text-base sm:text-lg">🎲</span>
          <span>გააგორე!</span>
        </button>
      )}

      {/* 3D Realistic Dice Pair inside Medallion Court */}
      {showDiceHere && (dice || isRolling) && (
        <div className="absolute z-20 pointer-events-none flex items-center justify-center">
          <Dice3DPair
            dice={dice}
            diceRemaining={diceRemaining}
            isRolling={isRolling}
            rollKey={rollKey}
            size={34}
          />
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="board-touch-surface relative w-full h-full max-w-5xl mx-auto flex flex-col justify-between select-none px-0.5 sm:px-1"
    >
      {/* Handcrafted Natural Georgian Wooden Case */}
      <div className={`p-1 sm:p-2.5 md:p-3.5 rounded-2xl ${theme.caseContainerClass} border-2 sm:border-[8px] shadow-[0_16px_40px_rgba(0,0,0,0.8),inset_0_2px_6px_rgba(255,255,255,0.4)] relative flex-1 flex flex-col justify-between overflow-hidden`}>
        {/* Inner Playing Board - Two Symmetrical Wooden Wings */}
        <div className={`relative flex-1 flex rounded-xl ${theme.innerFieldBgClass} border-2 sm:border-4 ${theme.innerFieldBorderClass} shadow-[inset_0_4px_25px_rgba(0,0,0,0.45)] overflow-hidden min-h-[280px]`}>
          {/* Floating Auto-Play Status Chip / Bear-Off Suggestion */}
          {isAutoPlay ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleAutoPlay?.();
              }}
              className="absolute top-2 left-1/2 -translate-x-1/2 z-40 px-3 py-1 rounded-full bg-emerald-950/95 border border-emerald-400 text-emerald-200 text-[10px] sm:text-xs font-bold shadow-[0_4px_16px_rgba(0,0,0,0.6)] flex items-center gap-1.5 backdrop-blur-md animate-pulse hover:bg-red-950 hover:border-red-400 hover:text-red-200 active:scale-95 transition pointer-events-auto cursor-pointer"
              title="დააჭირე ავტო-თამაშის გასაჩერებლად"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-300 fill-current animate-bounce" />
              <span>ავტო-თამაში აქტიურია (დააჭირე გასაჩერებლად)</span>
            </button>
          ) : canBearOffPhase && turn === 'WHITE' ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleAutoPlay?.();
              }}
              className="absolute top-2 left-1/2 -translate-x-1/2 z-40 px-3 py-1 rounded-full bg-amber-950/95 border border-amber-400 text-amber-200 text-[10px] sm:text-xs font-bold shadow-[0_4px_16px_rgba(0,0,0,0.6)] flex items-center gap-1.5 backdrop-blur-md animate-pulse hover:bg-amber-900 active:scale-95 transition pointer-events-auto cursor-pointer"
              title="ჩართე ავტომატური გამოსვლა"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>ყველა ქვა სახლშია — ჩართე ავტო-გამოსვლა ⚡</span>
            </button>
          ) : null}

          {/* ================= LEFT WING (COURT 1) ================= */}
          <div
            onClick={() => {
              if (canRoll && turn === 'WHITE' && onRoll) onRoll();
            }}
            className={`flex-1 relative flex flex-col justify-between p-0.5 sm:p-1.5 ${theme.wingGradientClass} ${
              canRoll && turn === 'WHITE' ? 'cursor-pointer hover:brightness-105 transition-all' : ''
            }`}
            style={{
              backgroundImage:
                `repeating-linear-gradient(90deg, ${theme.wingPatternColor} 0px, ${theme.wingPatternColor} 2px, transparent 2px, transparent 8px)`,
            }}
          >
            {renderCentralMedallion(turn === 'WHITE')}

            {/* Left Top Points (13..18) - Strict Grid */}
            <div className="grid grid-cols-6 w-full h-[40%] relative z-10">
              {leftTopIndices.map((idx, pos) => renderPoint(idx, true, 6 - pos, pos))}
            </div>

            {/* Left Bottom Points (12..7) - Strict Grid */}
            <div className="grid grid-cols-6 w-full h-[40%] relative z-10">
              {leftBottomIndices.map((idx, pos) => renderPoint(idx, false, pos + 1, pos))}
            </div>
          </div>

          {/* ================= CENTRAL WOODEN HINGE BAR (შუა ხარი) ================= */}
          <div className={`w-7 sm:w-10 md:w-12 ${theme.barClass} border-x sm:border-x-2 flex flex-col items-center justify-between py-2 sm:py-4 relative shadow-[0_0_12px_rgba(0,0,0,0.5)] z-20 shrink-0`}>
            {/* Center Folding Seam Line */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-[#4a2c11]/70 pointer-events-none" />

            {/* Top Metallic Hinge */}
            <div className={`relative z-10 w-5 sm:w-6 h-6 sm:h-7 ${theme.hingeClass} rounded-sm border shadow-sm flex flex-col items-center justify-between p-0.5`}>
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
            <div className="relative z-10 flex flex-col items-center gap-3 my-auto w-full">
              {/* White Bar */}
              {board.bar.WHITE > 0 && (
                <div
                  data-point-idx="BAR"
                  onClick={() => onPointClick('BAR')}
                  onDoubleClick={() => onPointDoubleClick('BAR')}
                  className={`cursor-pointer relative flex items-center justify-center w-[var(--checker-size,2rem)] h-[var(--checker-size,2rem)] ${
                    selectedPoint === 'BAR' ? 'ring-2 ring-amber-400 rounded-full scale-105' : ''
                  }`}
                  title="თეთრი ქვა ბარზე"
                >
                  {renderChecker(
                    'WHITE',
                    true,
                    0,
                    board.bar.WHITE,
                    false,
                    hintSource === 'BAR',
                    movableSourcePoints.includes('BAR'),
                    selectedPoint === 'BAR',
                    'BAR'
                  )}
                  {board.bar.WHITE > 1 && (
                    <span className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[9px] font-bold px-1 rounded-full shadow z-30">
                      +{board.bar.WHITE}
                    </span>
                  )}
                </div>
              )}

              {/* Black Bar */}
              {board.bar.BLACK > 0 && (
                <div
                  data-point-idx="BAR"
                  onClick={() => onPointClick('BAR')}
                  onDoubleClick={() => onPointDoubleClick('BAR')}
                  className={`cursor-pointer relative flex items-center justify-center w-[var(--checker-size,2rem)] h-[var(--checker-size,2rem)] ${
                    selectedPoint === 'BAR' ? 'ring-2 ring-amber-400 rounded-full scale-105' : ''
                  }`}
                  title="შავი ქვა ბარზე"
                >
                  {renderChecker(
                    'BLACK',
                    false,
                    0,
                    board.bar.BLACK,
                    false,
                    hintSource === 'BAR',
                    movableSourcePoints.includes('BAR'),
                    selectedPoint === 'BAR',
                    'BAR'
                  )}
                  {board.bar.BLACK > 1 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold px-1 rounded-full shadow z-30">
                      +{board.bar.BLACK}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Metallic Hinge */}
            <div className={`relative z-10 w-5 sm:w-6 h-6 sm:h-7 ${theme.hingeClass} rounded-sm border shadow-sm flex flex-col items-center justify-between p-0.5`}>
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
            onClick={() => {
              if (canRoll && turn === 'BLACK' && onRoll) onRoll();
            }}
            className={`flex-1 relative flex flex-col justify-between p-0.5 sm:p-1.5 ${theme.wingGradientClass} ${
              canRoll && turn === 'BLACK' ? 'cursor-pointer hover:brightness-105 transition-all' : ''
            }`}
            style={{
              backgroundImage:
                `repeating-linear-gradient(90deg, ${theme.wingPatternColor} 0px, ${theme.wingPatternColor} 2px, transparent 2px, transparent 8px)`,
            }}
          >
            {renderCentralMedallion(turn === 'BLACK')}

            {/* Right Top Points (19..24) - Strict Grid */}
            <div className="grid grid-cols-6 w-full h-[40%] relative z-10">
              {rightTopIndices.map((idx, pos) => renderPoint(idx, true, 6 - pos, pos))}
            </div>

            {/* Right Bottom Points (6..1) - Strict Grid */}
            <div className="grid grid-cols-6 w-full h-[40%] relative z-10">
              {rightBottomIndices.map((idx, pos) => renderPoint(idx, false, pos + 1, pos))}
            </div>
          </div>
        </div>

        {/* Bottom Gutter Bar: Locked Height, Zero-Shift Bear-Off Trays */}
        <div className={`h-7 sm:h-8 mt-1 border-t ${theme.troughBorderClass} flex items-center justify-between px-1 sm:px-2 text-[10px] sm:text-xs font-bold ${theme.troughTextClass} shrink-0`}>
          {/* Black Bear-Off Tray */}
          <div
            data-bear-off-zone="BLACK"
            onClick={() => {
              if (turn === 'BLACK' && canBearOffActive) onBearOffClick();
            }}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg transition-all ${
              turn === 'BLACK' && canBearOffActive
                ? 'bg-emerald-600 text-white shadow ring-2 ring-emerald-300 animate-pulse cursor-pointer'
                : `${theme.troughBlackClass}`
            }`}
          >
            <span>⚫ შავი:</span>
            <span className="font-black">{board.borneOff.BLACK} / 15</span>
          </div>

          <div className="text-[10px] opacity-75 font-semibold hidden md:inline">
            💡 ერთი შეხება / გადათრევა — სვლა • ორმაგი შეხება — სწრაფი სვლა
          </div>

          {/* White Bear-Off Tray */}
          <div
            data-bear-off-zone="WHITE"
            onClick={() => {
              if (turn === 'WHITE' && canBearOffActive) onBearOffClick();
            }}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg transition-all ${
              turn === 'WHITE' && canBearOffActive
                ? 'bg-emerald-600 text-white shadow ring-2 ring-emerald-300 animate-pulse cursor-pointer'
                : `${theme.troughWhiteClass}`
            }`}
          >
            <span>⚪ თეთრი:</span>
            <span className="font-black">{board.borneOff.WHITE} / 15</span>
          </div>
        </div>
      </div>

      {/* Floating Dragged Checker Indicator (under pointer/finger) */}
      {dragState && dragState.hasMoved && (
        <div
          className="fixed pointer-events-none z-50 w-[var(--checker-size,2rem)] h-[var(--checker-size,2rem)] rounded-full shadow-[0_12px_24px_rgba(0,0,0,0.85)] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center scale-110"
          style={{
            left: `${dragState.currentX}px`,
            top: `${dragState.currentY - 18}px`, // slightly elevated above finger tip
          }}
        >
          <div
            className={`w-full h-full rounded-full border-2 flex items-center justify-center ${
              dragState.owner === 'WHITE'
                ? `${theme.checkers.white.gradientClass} ring-2 ring-amber-400`
                : `${theme.checkers.black.gradientClass} ring-2 ring-amber-400`
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${dragState.owner === 'WHITE' ? theme.checkers.white.dragDotBg : theme.checkers.black.dragDotBg}`} />
          </div>
        </div>
      )}
    </div>
  );
};
