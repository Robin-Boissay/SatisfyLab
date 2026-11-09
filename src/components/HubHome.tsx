import React from 'react';
import { GameModule } from '../core/types';
import { GAMES_REGISTRY } from '../core/registry';
import { GameCardArtwork } from './GameCardArtwork';
import { useLanguage } from '../core/i18n';
import {
  Sparkles,
  Play,
  SlidersHorizontal,
  Flame,
  Volume2,
  Smartphone
} from 'lucide-react';

interface HubHomeProps {
  onSelectGame: (gameId: string) => void;
}

export const HubHome: React.FC<HubHomeProps> = ({ onSelectGame }) => {
  const { t, getGameMeta } = useLanguage();

  return (
    <div className="min-h-screen w-full bg-[#07090e] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-300">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 w-full bg-[#07090e]/85 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between pr-32 sm:pr-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-pink-500 p-[1.5px] shadow-neon-cyan">
            <div className="w-full h-full bg-[#07090e] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-widest uppercase bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                SATISFYLAB
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 font-bold">
                v1.5
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {t('app.tagline')}
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('app.format_badge')}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
            <Volume2 className="w-3.5 h-3.5 text-pink-400" />
            <span>{t('app.audio_badge')}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-1 shadow-sm">
            <Flame className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span>{t('hub.hero_badge', { count: GAMES_REGISTRY.length })}</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            {t('hub.hero_title_1')}
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
              {t('hub.hero_title_2')}
            </span>
          </h2>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            {t('hub.hero_desc')}
          </p>
        </div>

        {/* Game Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GAMES_REGISTRY.map((game: GameModule<any>) => {
            const meta = getGameMeta(game.id);
            const title = meta.name || game.name;
            const desc = meta.description || meta.shortDescription || game.description || game.shortDescription;
            const badge = meta.badge || game.badge;
            const tags = meta.tags || game.tags;

            return (
              <div
                key={game.id}
                onClick={() => onSelectGame(game.id)}
                className="group relative rounded-3xl bg-slate-900/60 border border-slate-800/90 hover:border-slate-700 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between"
              >
                {/* Visual Header / Artwork */}
                <div className="relative p-2.5">
                  <GameCardArtwork gameId={game.id} />

                  {/* Badge */}
                  {badge && (
                    <div className="absolute top-5 right-5 z-10 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-cyan-500/40 text-[10px] font-bold font-mono uppercase tracking-wider text-cyan-300 shadow-md">
                      {badge}
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-white group-hover:text-cyan-300 transition-colors">
                        {title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {desc}
                    </p>
                  </div>

                  {/* Tags */}
                  {tags && tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-slate-800/80 text-[10px] font-medium text-slate-400 border border-slate-700/60"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Play Action Button */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 group-hover:shadow-cyan-500/20 transition-all duration-200"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{t('hub.play_btn')}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Highlights Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 rounded-3xl bg-slate-900/40 border border-slate-800/60">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex-shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t('hub.feature1_title')}</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {t('hub.feature1_desc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20 flex-shrink-0">
              <Volume2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t('hub.feature2_title')}</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {t('hub.feature2_desc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t('hub.feature3_title')}</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {t('hub.feature3_desc')}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 px-4 py-4 text-center text-xs font-mono text-slate-500">
        <span>{t('hub.footer')}</span>
      </footer>
    </div>
  );
};

