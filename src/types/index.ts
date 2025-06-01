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
  players: Player[];
  status: GameStatus;
  currentWord?: string;
  currentCategory?: string;
  chameleonId?: string;
  createdAt: number;
  updatedAt: number;
}

export enum GameStatus {
  WAITING = 'waiting',
  PLAYING = 'playing',
  ENDED = 'ended'
}
