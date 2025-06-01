export interface Player {
  id: string;
  name: string;
  isChameleon: boolean;
  isReady: boolean;
  isHost: boolean;
}

export interface Game {
  id: string;
  joinCode: string;
  status: GameStatus;
  players: Player[];
  currentCategory?: string;
  currentWord?: string;
  categoryWords?: string[];
  chameleonId?: string;
  showWordBank?: boolean;
  createdAt: number;
  updatedAt: number;
}

export enum GameStatus {
  WAITING = 'waiting',
  PLAYING = 'playing',
  ENDED = 'ended'
}
