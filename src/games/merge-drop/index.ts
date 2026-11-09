import { GameModule } from '../../core/types';
import { MergeDropConfig, DEFAULT_MERGE_DROP_CONFIG } from './types';
import { mergeDropConfigSchema } from './configSchema';
import { MergeDropGame } from './MergeDropGame';

export const MergeDropModule: GameModule<MergeDropConfig> = {
  id: 'merge-drop',
  name: 'Neon & Solar Merge Drop',
  shortDescription: 'Lâche des orbes ou des planètes dans un bocal néon et fusionne-les jusqu’au Soleil Cosmique.',
  description: 'Inspiré du célèbre Watermelon / Suika Game : lâchez astéroïdes, planètes ou orbes cybernétiques dans un bocal galbé. Deux éléments identiques fusionnent pour monter de palier jusqu’à l’astre ultime : le Soleil géant ! Mode rafale continue disponible.',
  badge: 'Cosmique',
  icon: 'Layers',
  tags: ['Physique de fusion', 'Thème Solaire / Néon', 'Mode Rafale', 'Jarre galbée'],
  accentColor: '#ffe600',
  defaultConfig: DEFAULT_MERGE_DROP_CONFIG,
  configSchema: mergeDropConfigSchema,
  createGame: (canvas, config, onHUDUpdate) => {
    return new MergeDropGame(canvas, config, onHUDUpdate);
  }
};
