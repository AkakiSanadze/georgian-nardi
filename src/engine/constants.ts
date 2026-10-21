import { BoardState, CampaignRound, GameSettings, GameStats, PointState } from './types';

export const createInitialBoard = (): BoardState => {
  const points: PointState[] = Array.from({ length: 24 }, () => ({
    owner: null,
    count: 0,
  }));

  // Standard Backgammon / Georgian setup:
  // WHITE moves 23 -> 0 (Home board: 0..5)
  // BLACK moves 0 -> 23 (Home board: 18..23)

  // Point 23: 2 White checkers / Point 0: 2 Black checkers
  points[23] = { owner: 'WHITE', count: 2 };
  points[0] = { owner: 'BLACK', count: 2 };

  // Point 12: 5 White checkers / Point 11: 5 Black checkers
  points[12] = { owner: 'WHITE', count: 5 };
  points[11] = { owner: 'BLACK', count: 5 };

  // Point 7: 3 White checkers / Point 16: 3 Black checkers
  points[7] = { owner: 'WHITE', count: 3 };
  points[16] = { owner: 'BLACK', count: 3 };

  // Point 5: 5 White checkers / Point 18: 5 Black checkers
  points[5] = { owner: 'WHITE', count: 5 };
  points[18] = { owner: 'BLACK', count: 5 };

  return {
    points,
    bar: { WHITE: 0, BLACK: 0 },
    borneOff: { WHITE: 0, BLACK: 0 },
    lockedHomeHitPoints: [],
  };
};

export const GEORGIAN_DICE_NAMES: Record<string, string> = {
  // Doubles
  '1-1': 'იაქე (დუ-იაქე)',
  '2-2': 'დუბარა',
  '3-3': 'დუსე',
  '4-4': 'დუჩარი',
  '5-5': 'დუბეში',
  '6-6': 'დუშაში',

  // Non-doubles (normalized with higher die first)
  '2-1': 'იაქე-დუ',
  '3-1': 'სე-იაქე',
  '3-2': 'სე-დუ',
  '4-1': 'ჩარ-იაქე',
  '4-2': 'ჩარ-დუ',
  '4-3': 'ჩარ-სე',
  '5-1': 'ფანჯ-იაქე',
  '5-2': 'ფანჯ-დუ',
  '5-3': 'ფანჯ-სე',
  '5-4': 'ფანჯ-ჩარი',
  '6-1': 'შაშ-იაქე',
  '6-2': 'შაშ-დუ',
  '6-3': 'შაშ-სე',
  '6-4': 'შაშ-ჩარი',
  '6-5': 'შაშ-ბეში',
};

export const getGeorgianDiceName = (d1: number, d2: number): string => {
  const high = Math.max(d1, d2);
  const low = Math.min(d1, d2);
  const key = `${high}-${low}`;
  return GEORGIAN_DICE_NAMES[key] || `${high}-${low}`;
};

export const DAVI_LABELS = [
  'უდავო (1 ქულა)',
  'დავი! (2 ქულა)',
  'სე! (3 ქულა)',
  'ჩარი! (4 ქულა)',
  'ბეში! (5 ქულა)',
  'შაში! (6 ქულა)',
];

export const CAMPAIGN_ROUNDS: CampaignRound[] = [
  {
    id: 1,
    city: 'თბილისი',
    location: 'სოლოლაკის ეზო',
    opponentName: 'პაპა გივი',
    opponentTitle: 'უბნის ძველი მოთამაშე',
    opponentAvatar: '👴🏻',
    difficulty: 'BEGINNER',
    targetScore: 3,
    description: '„ჩემს ახალგაზრდობაში ნარდი ხელოვნება იყო. მოდი ვნახოთ, როგორ გესმის ქართული წესები!“',
    personality: 'CAUTIOUS',
  },
  {
    id: 2,
    city: 'მცხეთა',
    location: 'ძველი უბანი',
    opponentName: 'ლევანი',
    opponentTitle: 'მცხეთელი ენთუზიასტი',
    opponentAvatar: '🧔🏻',
    difficulty: 'BEGINNER',
    targetScore: 3,
    description: '„სვეტიცხოვლის ჩრდილში ნარდი სულ სხვაა. სწრაფი გაქცევა მიყვარს!“',
    personality: 'BALANCED',
  },
  {
    id: 3,
    city: 'თელავი',
    location: 'ჭადრების ბაღი',
    opponentName: 'ზაქრო ძია',
    opponentTitle: 'კახელი მეღვინე და ოსტატი',
    opponentAvatar: '👨🏼‍🦳',
    difficulty: 'AMATEUR',
    targetScore: 3,
    description: '„ერთი ჭიქა რქაწითელი და მოკვლა საკუთარი კარის გარეთ — აი ნამდვილი კახური ნარდი!“',
    personality: 'AGGRESSIVE',
  },
  {
    id: 4,
    city: 'გორი',
    location: 'ციხის ძირას',
    opponentName: 'სოსო',
    opponentTitle: 'ქართლელი მოთამაშე',
    opponentAvatar: '👱🏻‍♂️',
    difficulty: 'AMATEUR',
    targetScore: 5,
    description: '„მყარი პოზიცია ჩემი სტიქიაა. კარს ადვილად არ გაგიხსნი!“',
    personality: 'CAUTIOUS',
  },
  {
    id: 5,
    city: 'ბორჯომი',
    location: 'პარკის პავილიონი',
    opponentName: 'ნოდარი',
    opponentTitle: 'კურორტის ჩემპიონი',
    opponentAvatar: '🧐',
    difficulty: 'AMATEUR',
    targetScore: 5,
    description: '„ბორჯომის წყაროებთან 40 წელია ნარდს ვთამაშობ. კარის ჩაკეტვაში ვერავინ მჯობს!“',
    personality: 'BALANCED',
  },
  {
    id: 6,
    city: 'ქუთაისი',
    location: 'თეთრი ხიდი',
    opponentName: 'ბონდოია',
    opponentTitle: 'ქუთაისელი კოლორიტი',
    opponentAvatar: '😎',
    difficulty: 'SKILLED',
    targetScore: 5,
    description: '„რაია, დავი შეგეშინდა? ქუთაისში უდავოდ ნარდს არავინ თამაშობს, ძამია!“',
    personality: 'AGGRESSIVE',
  },
  {
    id: 7,
    city: 'ამბროლაური',
    location: 'რაჭის მყუდრო ეზო',
    opponentName: 'რაჟდენი',
    opponentTitle: 'რაჭველი ბრძენი',
    opponentAvatar: '👴🏼',
    difficulty: 'SKILLED',
    targetScore: 5,
    description: '„ნელა, დინჯად და ზუსტად. აჩქარებული ნარდი ვის უნახავს?“',
    personality: 'CAUTIOUS',
  },
  {
    id: 8,
    city: 'ზუგდიდი',
    location: 'დადიანების ბაღი',
    opponentName: 'ჯანსუღი',
    opponentTitle: 'ოდიშელი ტაქტიკოსი',
    opponentAvatar: '🤠',
    difficulty: 'SKILLED',
    targetScore: 7,
    description: '„კონტრშეტევა და დაჭერა — დააკვირდი ჩემს ყოველ კამათელს!“',
    personality: 'BALANCED',
  },
  {
    id: 9,
    city: 'ბათუმი',
    location: 'ბულვარის კოლონადა',
    opponentName: 'კაპიტანი ენვერი',
    opponentTitle: 'ზღვის მგელი',
    opponentAvatar: '⚓',
    difficulty: 'SKILLED',
    targetScore: 7,
    description: '„შტორმში კამათლის გაგორებას არაფერი სჯობს. სე-სა და ჩარზე თვალს არ დავახამხამებ!“',
    personality: 'AGGRESSIVE',
  },
  {
    id: 10,
    city: 'მესტია',
    location: 'კოშკების ჩრდილში',
    opponentName: 'ბესარიონი',
    opponentTitle: 'სვანეთის მთის ოსტატი',
    opponentAvatar: '🏔️',
    difficulty: 'GRANDMASTER',
    targetScore: 7,
    description: '„მთის სიმტკიცე და ცივი გონება. აქ შეცდომას არავინ გაპატიებს.“',
    personality: 'MASTER',
  },
  {
    id: 11,
    city: 'სიღნაღი',
    location: 'ნახევარფინალი — სიყვარულის ქალაქი',
    opponentName: 'ქეთევან ოსტატი',
    opponentTitle: 'ნარდის დედოფალი',
    opponentAvatar: '👑',
    difficulty: 'GRANDMASTER',
    targetScore: 9,
    description: '„ჩემი 6-კარიანი კედელი ლეგენდარულია. ვნახოთ, როგორ გამოხვალ ჩემი მახიდან!“',
    personality: 'MASTER',
  },
  {
    id: 12,
    city: 'თბილისი',
    location: 'დიდი ფინალი — ოქროს კამათელი',
    opponentName: 'ვახტანგ დიდოსტატი',
    opponentTitle: 'საქართველოს ჩემპიონი',
    opponentAvatar: '🏆',
    difficulty: 'GRANDMASTER',
    targetScore: 11,
    description: '„თბილისის ოქროს კამათლის ფინალი. აჩვენე მთელ საქართველოს ნამდვილი ოსტატობა!“',
    personality: 'MASTER',
  },
];

export const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  soundVolume: 0.8,
  hapticFeedbackEnabled: true,
  singleTapMoveEnabled: false,
  animationSpeed: 'NORMAL',
  countMarsOnDavi: true,
  allowHitAndCoverInHome: true,
  showPointNumbers: true,
  showLegalTargets: true,
  autoBearOff: false,
  boardTheme: 'CLASSIC_WALNUT',
};

export const DEFAULT_STATS: GameStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  marsWon: 0,
  marsLost: 0,
  daviWon: 0,
  daviAccepted: 0,
  diceRollsCount: {},
};
