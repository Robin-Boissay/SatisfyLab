import { GameModule } from '../../core/types';
import { BallEscapeConfig, DEFAULT_BALL_ESCAPE_CONFIG } from './types';
import { ballEscapeConfigSchema } from './configSchema';
import { BallEscapeGame } from './BallEscapeGame';

export const BallEscapeModule: GameModule<BallEscapeConfig> = {
  id: 'ball-escape',
  name: 'Ball Escape 30s',
  shortDescription: 'Défi chrono dans une arène en rotation (Multi-Anneaux, Duel Cyan vs Rose & ASMR).',
  description: 'Une bille lancée au cœur d’une arène circulaire accélère à chaque rebond. Traversez jusqu’à 6 anneaux concentriques ou affrontez un adversaire en duel 2 couleurs avec sons de piano et mélodies ASMR cultes (Megalovania, Coffin Dance). Climax en bullet time et boucle parfaite TikTok.',
  badge: 'Viral TikTok',
  icon: 'CircleDot',
  tags: ['Multi-Anneaux', 'Duel 2 Couleurs', 'ASMR Mélodique', 'Safe Zone 9:16', 'Bullet Time'],
  accentColor: '#00f0ff',
  defaultConfig: DEFAULT_BALL_ESCAPE_CONFIG,
  configSchema: ballEscapeConfigSchema,
  createGame: (canvas, config, onHUDUpdate) => {
    return new BallEscapeGame(canvas, config, onHUDUpdate);
  }
};
