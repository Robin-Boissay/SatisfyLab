import { GameModule } from './types';
import { BallEscapeModule } from '../games/ball-escape';
import { MergeDropModule } from '../games/merge-drop';
import { BallDuelModule } from '../games/ball-duel';
import { TerritoryWarModule } from '../games/territory-war';

export const GAMES_REGISTRY: GameModule<any>[] = [
  BallEscapeModule,
  MergeDropModule,
  BallDuelModule,
  TerritoryWarModule
];

export function getGameById(id: string): GameModule<any> | undefined {
  return GAMES_REGISTRY.find((game) => game.id === id);
}
