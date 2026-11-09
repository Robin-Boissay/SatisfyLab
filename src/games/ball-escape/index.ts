import { GameModule } from '../../core/types';
import { BallEscapeConfig, DEFAULT_BALL_ESCAPE_CONFIG } from './types';
import { ballEscapeConfigSchema } from './configSchema';
import { BallEscapeGame } from './BallEscapeGame';

export const BallEscapeModule: GameModule<BallEscapeConfig> = {
  id: 'ball-escape',
  name: 'Ball Escape 30s',
  shortDescription: 'Défi chrono dans une arène circulaire en rotation avec briques destructibles.',
  description: 'Une bille lancée au cœur d’une arène circulaire fermée accélère à chaque rebond contre les parois. Brisez les briques d’arc pour ouvrir une brèche et tentez de vous évader avant la fin du temps imparti. Sons de montée harmonique et climax en bullet time.',
  badge: 'Populaire',
  icon: 'CircleDot',
  tags: ['Arène 360°', 'Accélération exponentielle', 'Bullet Time', 'Sons harmoniques'],
  accentColor: '#00f0ff',
  defaultConfig: DEFAULT_BALL_ESCAPE_CONFIG,
  configSchema: ballEscapeConfigSchema,
  createGame: (canvas, config, onHUDUpdate) => {
    return new BallEscapeGame(canvas, config, onHUDUpdate);
  }
};
