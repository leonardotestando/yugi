export type CardType = 'MONSTER' | 'SPELL';
export type Position = 'ATTACK' | 'DEFENSE' | 'SET';
export type Phase = 'DRAW' | 'MAIN_1' | 'BATTLE' | 'MAIN_2' | 'END';

export interface CardTemplate {
  cardId: string;
  name: string;
  type: CardType;
  description: string;
  atk?: number;
  def?: number;
  level?: number;
  imageUrl?: string;
}

export interface GameCard extends CardTemplate {
  id: string;
  position?: Position;
  canAttack?: boolean;
  hasAttacked?: boolean;
}

export interface PlayerState {
  lp: number;
  deck: GameCard[];
  hand: GameCard[];
  monsterZone: (GameCard | null)[];
  spellZone: (GameCard | null)[];
  graveyard: GameCard[];
  hasNormalSummoned: boolean;
}

export interface GameState {
  player1: PlayerState;
  player2: PlayerState;
  turn: 'player1' | 'player2';
  phase: Phase;
  turnCount: number;
  log: string[];
  winner: 'player1' | 'player2' | null;
}

export type Action = 
  | { type: 'NEXT_PHASE' }
  | { type: 'DRAW_CARD' }
  | { type: 'SUMMON_MONSTER'; cardId: string; zoneIndex: number; position: Position }
  | { type: 'CHANGE_POSITION'; zoneIndex: number; position: Position }
  | { type: 'ACTIVATE_SPELL'; cardId: string; zoneIndex: number; targetIndex?: number }
  | { type: 'ATTACK'; attackerIndex: number; targetIndex: number | null };
