import { GameModule } from '../../core/types';
import { BallDuelConfig, DEFAULT_BALL_DUEL_CONFIG } from './types';
import { ballDuelConfigSchema } from './configSchema';
import { BallDuelGame } from './BallDuelGame';

export const BallDuelModule: GameModule<BallDuelConfig> = {
  id: 'ball-duel',
  name: 'Ball Duel (Gauche vs Droite)',
  shortDescription: 'Course de destruction à deux colonnes avec améliorations exponentielles ou Fibonacci.',
  description: 'Un duel intense en deux colonnes verticales : les billes bleues et roses chutent sur une série de barres horizontales à PV. À chaque barre pulvérisée, débloquez une explosion de billes ou une montée en puissance (multiplication, addition, puissances ou suite de Fibonacci) jusqu’à la ligne d’arrivée !',
  badge: 'Nouveau',
  icon: 'Swords',
  tags: ['Duel 2 Colonnes', 'Formules mathématiques', 'Destruction de barres', 'Fibonacci'],
  accentColor: '#ff007f',
  defaultConfig: DEFAULT_BALL_DUEL_CONFIG,
  configSchema: ballDuelConfigSchema,
  createGame: (canvas, config, onHUDUpdate) => {
    return new BallDuelGame(canvas, config, onHUDUpdate);
  }
};

