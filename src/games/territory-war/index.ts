import { GameModule } from '../../core/types';
import { TerritoryWarConfig, DEFAULT_TERRITORY_WAR_CONFIG } from './types';
import { territoryWarConfigSchema } from './configSchema';
import { TerritoryWarGame } from './TerritoryWarGame';

export const TerritoryWarModule: GameModule<TerritoryWarConfig> = {
  id: 'territory-war',
  name: 'Territory War (Cyan vs Rose)',
  shortDescription: 'La simulation virale de conquête de territoire à 100% : une bataille hypnotique en boucle.',
  description: 'Inspiré du phénomène viral "Day vs Night" / "Color Fill" de TikTok et Instagram : deux billes rebondissent dans une grille néon et convertissent chaque tuile heurtée à leur couleur. Une guerre de territoire palpitante, 100% autonome et accompagnée d’une bande-son procédurale en carillon harmonique.',
  badge: 'Viral TikTok',
  icon: 'Flag',
  tags: ['Conquête 100%', 'Carillon procédural', 'Autonome', 'Oddly Satisfying'],
  accentColor: '#00f0ff',
  defaultConfig: DEFAULT_TERRITORY_WAR_CONFIG,
  configSchema: territoryWarConfigSchema,
  createGame: (canvas, config, onHUDUpdate) => {
    return new TerritoryWarGame(canvas, config, onHUDUpdate);
  }
};

