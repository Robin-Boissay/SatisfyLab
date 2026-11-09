import React from 'react';
import { GAMES_REGISTRY } from '../core/registry';
import { CircleDot, Layers, Swords, Sparkles } from 'lucide-react';

interface GameSelectorProps {
  activeGameId: string;
  onSelectGame: (id: string) => void;
}

export const GameSelector: React.FC<GameSelectorProps> = ({
  activeGameId,
  onSelectGame
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'CircleDot':
        return <CircleDot className="w-5 h-5" />;
      case 'Layers':
        return <Layers className="w-5 h-5" />;
      case 'Swords':
        return <Swords className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold tracking-wider uppercase text-slate-400">
          Sélection du Jeu
        </label>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
          {GAMES_REGISTRY.length} JEUX DISPONIBLES
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {GAMES_REGISTRY.map((game) => {
          const isActive = game.id === activeGameId;
          return (
            <button
              key={game.id}
              onClick={() => onSelectGame(game.id)}
              className={`relative p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                isActive
                  ? 'bg-gradient-to-b from-cyan-950/40 to-slate-900 border-cyan-500/80 shadow-neon-cyan'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-400'
              }`}
            >
              {game.badge && (
                <span
                  className={`absolute top-2 right-2 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {game.badge}
                </span>
              )}

              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 transition-colors ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-slate-800/80 text-slate-400'
                }`}
              >
                {getIcon(game.icon)}
              </div>

              <div>
                <h3
                  className={`text-xs font-bold leading-tight ${
                    isActive ? 'text-white' : 'text-slate-300'
                  }`}
                >
                  {game.name}
                </h3>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
