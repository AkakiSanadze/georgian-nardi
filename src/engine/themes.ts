import { BoardThemeId } from './types';
export type { BoardThemeId };

export interface BoardThemeConfig {
  id: BoardThemeId;
  name: string;
  subtitle: string;
  badge: string;
  previewColors: {
    frame: string;
    field: string;
    point: string;
    accent: string;
  };
  appBgClass: string;
  caseContainerClass: string;
  innerFieldBorderClass: string;
  innerFieldBgClass: string;
  wingGradientClass: string;
  wingPatternColor: string;
  barClass: string;
  hingeClass: string;
  troughBorderClass: string;
  troughTextClass: string;
  troughWhiteClass: string;
  troughBlackClass: string;
  pointSvg: {
    baseFill: string;
    baseStroke: string;
    outerCircleFill: string;
    outerCircleStroke: string;
    innerCircleFill: string;
    innerCircleStroke: string;
    numberFill: string;
    filigreeStroke: string;
    filigreeOpacity: number;
    scallopArchBg: string;
    scallopArchBorder: string;
  };
  medallionSvg: {
    outerRingStroke: string;
    innerRingStroke: string;
    primaryFill: string;
    accentFill: string;
    opacity: string;
  };
  checkers: {
    white: {
      gradientClass: string;
      outerRingBorder: string;
      innerCircleBorder: string;
      innerCircleBg: string;
      dotBg: string;
      dragDotBg: string;
    };
    black: {
      gradientClass: string;
      outerRingBorder: string;
      innerCircleBorder: string;
      innerCircleBg: string;
      dotBg: string;
      dragDotBg: string;
    };
  };
}

export const BOARD_THEMES: Record<BoardThemeId, BoardThemeConfig> = {
  CLASSIC_WALNUT: {
    id: 'CLASSIC_WALNUT',
    name: 'კლასიკური კაკალი',
    subtitle: 'ტრადიციული ხის ოსტატობა',
    badge: '🪵',
    previewColors: {
      frame: '#8c5f32',
      field: '#e6be8a',
      point: '#1a110b',
      accent: '#d8ad75',
    },
    appBgClass: 'bg-gradient-to-b from-[#140b06] via-[#1c100a] to-[#0d0704]',
    caseContainerClass:
      'bg-gradient-to-br from-[#c99b68] via-[#dfb685] to-[#b0804d] border-[#8c5f32]',
    innerFieldBorderClass: 'border-[#6e441f]',
    innerFieldBgClass: 'bg-[#e6be8a]',
    wingGradientClass: 'bg-gradient-to-b from-[#dfb47c] via-[#eac593] to-[#dfb47c]',
    wingPatternColor: 'rgba(120,72,30,0.04)',
    barClass: 'bg-gradient-to-r from-[#b58450] via-[#d4a572] to-[#b58450] border-[#6e441f]',
    hingeClass: 'bg-gradient-to-b from-[#d8d4c8] via-[#b8b2a2] to-[#8c8576] border-[#4a443b]',
    troughBorderClass: 'border-[#7a4e25]/40',
    troughTextClass: 'text-[#3b200c]',
    troughWhiteClass: 'bg-[#5c3516] text-amber-100 border-[#804f26]',
    troughBlackClass: 'bg-[#2a1608] text-amber-200 border-[#5c3a1b]',
    pointSvg: {
      baseFill: '#1a110b',
      baseStroke: '#120a06',
      outerCircleFill: '#1a110b',
      outerCircleStroke: '#2e1a0e',
      innerCircleFill: '#e2b982',
      innerCircleStroke: '#1a110b',
      numberFill: '#1a110b',
      filigreeStroke: '#d8ad75',
      filigreeOpacity: 0.85,
      scallopArchBg: 'bg-gradient-to-b from-[#b8864e]/45 to-[#d8ad75]/15',
      scallopArchBorder: 'border-[#7a4e25]/40',
    },
    medallionSvg: {
      outerRingStroke: '#1a110b',
      innerRingStroke: '#1a110b',
      primaryFill: '#1a110b',
      accentFill: '#e6be8a',
      opacity: 'opacity-80',
    },
    checkers: {
      white: {
        gradientClass:
          'bg-gradient-to-br from-[#ffffff] via-[#f7f1e5] to-[#dccab0] border border-[#b09b7e] sm:border-2 shadow-[0_2px_6px_rgba(0,0,0,0.55),inset_0_1.5px_3px_rgba(255,255,255,0.95)] text-[#3b2a1a]',
        outerRingBorder: 'border-[#bfa888]',
        innerCircleBorder: 'border-[#bfa888]',
        innerCircleBg: 'bg-[#efe3d2]',
        dotBg: 'bg-[#a88e6b]',
        dragDotBg: 'bg-amber-400/80',
      },
      black: {
        gradientClass:
          'bg-gradient-to-br from-[#593e2e] via-[#382214] to-[#1a0d06] border border-[#704d37] sm:border-2 shadow-[0_2px_6px_rgba(0,0,0,0.75),inset_0_1.5px_2.5px_rgba(255,255,255,0.22)] text-[#e8dacb]',
        outerRingBorder: 'border-[#8a6245]',
        innerCircleBorder: 'border-[#785338]',
        innerCircleBg: 'bg-[#29170c]',
        dotBg: 'bg-[#9c7252]',
        dragDotBg: 'bg-amber-400/80',
      },
    },
  },

  ROYAL_EMERALD: {
    id: 'ROYAL_EMERALD',
    name: 'სამეფო მაუდი',
    subtitle: 'ზურმუხტისფერი მაუდი და მაჰაგონი',
    badge: '👑',
    previewColors: {
      frame: '#752c1e',
      field: '#14452f',
      point: '#061a10',
      accent: '#d4af37',
    },
    appBgClass: 'bg-gradient-to-b from-[#05140d] via-[#092317] to-[#040e09]',
    caseContainerClass:
      'bg-gradient-to-br from-[#541e15] via-[#752c1e] to-[#42140c] border-[#2f0e08]',
    innerFieldBorderClass: 'border-[#1e0a06]',
    innerFieldBgClass: 'bg-[#113825]',
    wingGradientClass: 'bg-gradient-to-b from-[#0d2e1f] via-[#14452f] to-[#0d2e1f]',
    wingPatternColor: 'rgba(255,215,0,0.03)',
    barClass: 'bg-gradient-to-r from-[#42140c] via-[#5e2116] to-[#42140c] border-[#220a05]',
    hingeClass: 'bg-gradient-to-b from-[#f3e3a3] via-[#d4af37] to-[#997c1d] border-[#5e4b10]',
    troughBorderClass: 'border-[#36130b]/60',
    troughTextClass: 'text-[#e2f3e8]',
    troughWhiteClass: 'bg-[#1b4332] text-emerald-100 border-[#2d6a4f]',
    troughBlackClass: 'bg-[#1b1514] text-amber-200 border-[#4a261f]',
    pointSvg: {
      baseFill: '#061a10',
      baseStroke: '#030d08',
      outerCircleFill: '#061a10',
      outerCircleStroke: '#d4af37',
      innerCircleFill: '#d4af37',
      innerCircleStroke: '#061a10',
      numberFill: '#081d12',
      filigreeStroke: '#d4af37',
      filigreeOpacity: 0.95,
      scallopArchBg: 'bg-gradient-to-b from-[#d4af37]/35 to-[#14452f]/20',
      scallopArchBorder: 'border-[#d4af37]/40',
    },
    medallionSvg: {
      outerRingStroke: '#d4af37',
      innerRingStroke: '#d4af37',
      primaryFill: '#071d12',
      accentFill: '#d4af37',
      opacity: 'opacity-85',
    },
    checkers: {
      white: {
        gradientClass:
          'bg-gradient-to-br from-[#ffffff] via-[#f4f7f5] to-[#d5ded8] border border-[#a8bdb2] sm:border-2 shadow-[0_2px_6px_rgba(0,0,0,0.55),inset_0_1.5px_3px_rgba(255,255,255,0.95)] text-[#1b4332]',
        outerRingBorder: 'border-[#8eb39d]',
        innerCircleBorder: 'border-[#8eb39d]',
        innerCircleBg: 'bg-[#e3ece6]',
        dotBg: 'bg-[#52796f]',
        dragDotBg: 'bg-emerald-400',
      },
      black: {
        gradientClass:
          'bg-gradient-to-br from-[#2a302d] via-[#171b19] to-[#0c0e0d] border border-[#44524b] sm:border-2 shadow-[0_2px_6px_rgba(0,0,0,0.75),inset_0_1.5px_2.5px_rgba(212,175,55,0.35)] text-[#d4af37]',
        outerRingBorder: 'border-[#d4af37]/60',
        innerCircleBorder: 'border-[#d4af37]/40',
        innerCircleBg: 'bg-[#131715]',
        dotBg: 'bg-[#d4af37]',
        dragDotBg: 'bg-amber-400',
      },
    },
  },

  EBONY_GOLD: {
    id: 'EBONY_GOLD',
    name: 'შავი აბანოზი და ოქრო',
    subtitle: 'პრემიუმ ობსიდიანი და ოქრო',
    badge: '✨',
    previewColors: {
      frame: '#383a42',
      field: '#1a1c22',
      point: '#4a0e14',
      accent: '#eab308',
    },
    appBgClass: 'bg-gradient-to-b from-[#0a0a0d] via-[#121318] to-[#060608]',
    caseContainerClass:
      'bg-gradient-to-br from-[#2a2b30] via-[#383a42] to-[#1c1d22] border-[#4a4d57]',
    innerFieldBorderClass: 'border-[#111215]',
    innerFieldBgClass: 'bg-[#141518]',
    wingGradientClass: 'bg-gradient-to-b from-[#111215] via-[#1a1c22] to-[#111215]',
    wingPatternColor: 'rgba(234,179,8,0.03)',
    barClass: 'bg-gradient-to-r from-[#1e2026] via-[#2d2f38] to-[#1e2026] border-[#111215]',
    hingeClass: 'bg-gradient-to-b from-[#fde68a] via-[#eab308] to-[#a16207] border-[#713f12]',
    troughBorderClass: 'border-[#374151]/50',
    troughTextClass: 'text-[#f3f4f6]',
    troughWhiteClass: 'bg-[#2e2616] text-amber-200 border-[#785b1e]',
    troughBlackClass: 'bg-[#111317] text-gray-300 border-[#2d3139]',
    pointSvg: {
      baseFill: '#4a0e14',
      baseStroke: '#2b080c',
      outerCircleFill: '#4a0e14',
      outerCircleStroke: '#eab308',
      innerCircleFill: '#eab308',
      innerCircleStroke: '#4a0e14',
      numberFill: '#181a1e',
      filigreeStroke: '#eab308',
      filigreeOpacity: 0.95,
      scallopArchBg: 'bg-gradient-to-b from-[#eab308]/30 to-[#4a0e14]/20',
      scallopArchBorder: 'border-[#eab308]/40',
    },
    medallionSvg: {
      outerRingStroke: '#eab308',
      innerRingStroke: '#ca8a04',
      primaryFill: '#380a0e',
      accentFill: '#eab308',
      opacity: 'opacity-85',
    },
    checkers: {
      white: {
        gradientClass:
          'bg-gradient-to-br from-[#fffbeb] via-[#fef3c7] to-[#fde68a] border border-[#f59e0b] sm:border-2 shadow-[0_2px_6px_rgba(0,0,0,0.6),inset_0_1.5px_3px_rgba(255,255,255,0.95)] text-[#78350f]',
        outerRingBorder: 'border-[#d97706]',
        innerCircleBorder: 'border-[#f59e0b]',
        innerCircleBg: 'bg-[#fef9c3]',
        dotBg: 'bg-[#b45309]',
        dragDotBg: 'bg-amber-400',
      },
      black: {
        gradientClass:
          'bg-gradient-to-br from-[#2f3238] via-[#1c1d22] to-[#0c0d10] border border-[#525661] sm:border-2 shadow-[0_2px_6px_rgba(0,0,0,0.85),inset_0_1.5px_2.5px_rgba(234,179,8,0.3)] text-[#eab308]',
        outerRingBorder: 'border-[#6b7280]',
        innerCircleBorder: 'border-[#4b5563]',
        innerCircleBg: 'bg-[#16171b]',
        dotBg: 'bg-[#eab308]',
        dragDotBg: 'bg-yellow-400',
      },
    },
  },

  COLCHIAN_WINE: {
    id: 'COLCHIAN_WINE',
    name: 'კოლხური საფერავი',
    subtitle: 'ქვევრის ღვინო და ალუბლის ხე',
    badge: '🍷',
    previewColors: {
      frame: '#912d3b',
      field: '#f4dfcb',
      point: '#4a0e18',
      accent: '#c28d62',
    },
    appBgClass: 'bg-gradient-to-b from-[#170609] via-[#240a10] to-[#0e0306]',
    caseContainerClass:
      'bg-gradient-to-br from-[#731f2b] via-[#912d3b] to-[#591620] border-[#3f0f16]',
    innerFieldBorderClass: 'border-[#450e17]',
    innerFieldBgClass: 'bg-[#edd5c0]',
    wingGradientClass: 'bg-gradient-to-b from-[#e7cbaf] via-[#f4dfcb] to-[#e7cbaf]',
    wingPatternColor: 'rgba(115,31,43,0.05)',
    barClass: 'bg-gradient-to-r from-[#631c25] via-[#852735] to-[#631c25] border-[#3f0f16]',
    hingeClass: 'bg-gradient-to-b from-[#e8cfbe] via-[#c49e85] to-[#8c6751] border-[#543b2c]',
    troughBorderClass: 'border-[#852735]/40',
    troughTextClass: 'text-[#3f0f16]',
    troughWhiteClass: 'bg-[#f8ede3] text-[#4a121b] border-[#d8bca6]',
    troughBlackClass: 'bg-[#420f17] text-rose-100 border-[#691e2b]',
    pointSvg: {
      baseFill: '#4a0e18',
      baseStroke: '#2d070e',
      outerCircleFill: '#4a0e18',
      outerCircleStroke: '#c28d62',
      innerCircleFill: '#f0dacf',
      innerCircleStroke: '#4a0e18',
      numberFill: '#4a0e18',
      filigreeStroke: '#c28d62',
      filigreeOpacity: 0.9,
      scallopArchBg: 'bg-gradient-to-b from-[#852735]/35 to-[#f4dfcb]/15',
      scallopArchBorder: 'border-[#852735]/40',
    },
    medallionSvg: {
      outerRingStroke: '#4a0e18',
      innerRingStroke: '#631c25',
      primaryFill: '#4a0e18',
      accentFill: '#edd5c0',
      opacity: 'opacity-85',
    },
    checkers: {
      white: {
        gradientClass:
          'bg-gradient-to-br from-[#ffffff] via-[#faf2ea] to-[#e3d1c1] border border-[#baa290] sm:border-2 shadow-[0_2px_6px_rgba(0,0,0,0.55),inset_0_1.5px_3px_rgba(255,255,255,0.95)] text-[#4a0e18]',
        outerRingBorder: 'border-[#caa993]',
        innerCircleBorder: 'border-[#caa993]',
        innerCircleBg: 'bg-[#f4eae0]',
        dotBg: 'bg-[#9c7860]',
        dragDotBg: 'bg-rose-400',
      },
      black: {
        gradientClass:
          'bg-gradient-to-br from-[#6b1623] via-[#480c16] to-[#24040a] border border-[#8a2434] sm:border-2 shadow-[0_2px_6px_rgba(0,0,0,0.75),inset_0_1.5px_2.5px_rgba(255,255,255,0.25)] text-[#ffd4dc]',
        outerRingBorder: 'border-[#a83a4c]',
        innerCircleBorder: 'border-[#7d1c2d]',
        innerCircleBg: 'bg-[#360810]',
        dotBg: 'bg-[#c74a5e]',
        dragDotBg: 'bg-rose-500',
      },
    },
  },

  CAUCASUS_MARBLE: {
    id: 'CAUCASUS_MARBLE',
    name: 'კავკასიური მარმარილო',
    subtitle: 'მთის მარმარილო და ლაჟვარდი',
    badge: '🏔️',
    previewColors: {
      frame: '#64748b',
      field: '#f1f5f9',
      point: '#172e4c',
      accent: '#38bdf8',
    },
    appBgClass: 'bg-gradient-to-b from-[#090d14] via-[#0f1724] to-[#06090e]',
    caseContainerClass:
      'bg-gradient-to-br from-[#4b5563] via-[#64748b] to-[#374151] border-[#1f2937]',
    innerFieldBorderClass: 'border-[#1e293b]',
    innerFieldBgClass: 'bg-[#e2e8f0]',
    wingGradientClass: 'bg-gradient-to-b from-[#d9e2ec] via-[#f1f5f9] to-[#d9e2ec]',
    wingPatternColor: 'rgba(30,58,95,0.04)',
    barClass: 'bg-gradient-to-r from-[#475569] via-[#64748b] to-[#475569] border-[#1e293b]',
    hingeClass: 'bg-gradient-to-b from-[#e2e8f0] via-[#cbd5e1] to-[#94a3b8] border-[#475569]',
    troughBorderClass: 'border-[#64748b]/40',
    troughTextClass: 'text-[#0f172a]',
    troughWhiteClass: 'bg-[#f8fafc] text-slate-800 border-[#cbd5e1]',
    troughBlackClass: 'bg-[#1e293b] text-sky-100 border-[#334155]',
    pointSvg: {
      baseFill: '#172e4c',
      baseStroke: '#0c1b30',
      outerCircleFill: '#172e4c',
      outerCircleStroke: '#38bdf8',
      innerCircleFill: '#e0f2fe',
      innerCircleStroke: '#172e4c',
      numberFill: '#0c1b30',
      filigreeStroke: '#38bdf8',
      filigreeOpacity: 0.9,
      scallopArchBg: 'bg-gradient-to-b from-[#38bdf8]/35 to-[#f1f5f9]/15',
      scallopArchBorder: 'border-[#0284c7]/40',
    },
    medallionSvg: {
      outerRingStroke: '#172e4c',
      innerRingStroke: '#0369a1',
      primaryFill: '#172e4c',
      accentFill: '#e2e8f0',
      opacity: 'opacity-85',
    },
    checkers: {
      white: {
        gradientClass:
          'bg-gradient-to-br from-[#ffffff] via-[#f8fafc] to-[#dbeafe] border border-[#93c5fd] sm:border-2 shadow-[0_2px_6px_rgba(0,0,0,0.5),inset_0_1.5px_3px_rgba(255,255,255,0.95)] text-[#1e3a8a]',
        outerRingBorder: 'border-[#bfdbfe]',
        innerCircleBorder: 'border-[#bfdbfe]',
        innerCircleBg: 'bg-[#eff6ff]',
        dotBg: 'bg-[#3b82f6]',
        dragDotBg: 'bg-sky-400',
      },
      black: {
        gradientClass:
          'bg-gradient-to-br from-[#1e3a8a] via-[#172554] to-[#0a1128] border border-[#3b82f6] sm:border-2 shadow-[0_2px_6px_rgba(0,0,0,0.75),inset_0_1.5px_2.5px_rgba(147,197,253,0.3)] text-[#bfdbfe]',
        outerRingBorder: 'border-[#60a5fa]',
        innerCircleBorder: 'border-[#3b82f6]',
        innerCircleBg: 'bg-[#111c3a]',
        dotBg: 'bg-[#60a5fa]',
        dragDotBg: 'bg-cyan-400',
      },
    },
  },
};

export const THEME_ORDER: BoardThemeId[] = [
  'CLASSIC_WALNUT',
  'ROYAL_EMERALD',
  'EBONY_GOLD',
  'COLCHIAN_WINE',
  'CAUCASUS_MARBLE',
];

export const getNextTheme = (current: BoardThemeId = 'CLASSIC_WALNUT'): BoardThemeId => {
  const currentIndex = THEME_ORDER.indexOf(current);
  if (currentIndex === -1 || currentIndex === THEME_ORDER.length - 1) {
    return THEME_ORDER[0];
  }
  return THEME_ORDER[currentIndex + 1];
};
