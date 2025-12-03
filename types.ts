
export enum AppScreen {
  WELCOME = 'WELCOME',
  HOME = 'HOME',
  CHARACTER = 'CHARACTER',
  GAMES = 'GAMES',
  ART = 'ART'
}

export interface CharacterAttributes {
  color: string;
  accessory: string;
  name: string;
}

export enum GameType {
  PATTERN = 'PATTERN',
  SHADOW = 'SHADOW',
  MEMORY = 'MEMORY'
}

export interface AudioState {
  isSpeaking: boolean;
  isPlaying: boolean;
}
