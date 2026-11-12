import React, { useState } from 'react';
import { ConfigSchema, RangeConfigField, StringConfigField, ActionButtonConfigField } from '../core/types';
import { useLanguage } from '../core/i18n';
import { RotateCcw, Sliders, Activity, Eye, Type, Volume2, Check, Sparkles, Wand2, Loader2, AlertCircle } from 'lucide-react';
import { getThemeDefinition } from '../games/merge-drop/themeRegistry';
import { voiceAnnouncer } from '../core/VoiceAnnouncer';

export interface DynamicControlsProps {
  schema: ConfigSchema;
  values: Record<string, any>;
  defaultValues: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onReset?: () => void;
  allowedCategories?: ('gameplay' | 'physics' | 'visuals' | 'texts' | 'audio')[];
  defaultTab?: 'all' | 'gameplay' | 'physics' | 'visuals' | 'texts' | 'audio';
  showReset?: boolean;
}

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  gameplay: Sliders,
  physics: Activity,
  visuals: Eye,
  texts: Type,
  audio: Volume2
};

const CATEGORY_NAMES_FR: Record<string, string> = {
  gameplay: 'Gameplay & Règles',
  physics: 'Moteur Physique',
  visuals: 'Visuels & Conteneur',
  texts: 'Textes & Titres',
  audio: 'Sons & Audio ASMR'
};

const CATEGORY_NAMES_EN: Record<string, string> = {
  gameplay: 'Gameplay & Rules',
  physics: 'Physics Engine',
  visuals: 'Visuals & Container',
  texts: 'Texts & Titles',
  audio: 'Sounds & ASMR Audio'
};

export const DynamicControls: React.FC<DynamicControlsProps> = ({
  schema,
  values,
  defaultValues,
  onChange,
  onReset,
  allowedCategories,
  defaultTab = 'all',
  showReset = true
}) => {
  const { language, t, getFieldMeta } = useLanguage();
  const [activeTab, setActiveTab] = useState<'all' | 'gameplay' | 'physics' | 'visuals' | 'texts' | 'audio'>(defaultTab);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [actionStatus, setActionStatus] = useState<Record<string, { success?: boolean; message?: string }>>({});

  const handleActionButtonClick = async (field: ActionButtonConfigField) => {
    if (field.actionId === 'GENERATE_THEME_VOICES') {
      const themeId = values.SKIN_THEME || 'potatoes';
      const prefix = values.VOICE_ANNOUNCER_PREFIX !== undefined ? values.VOICE_ANNOUNCER_PREFIX : (themeId.includes('potatoes') ? 'Patate' : '');
      const themeDef = getThemeDefinition(themeId);
      const tiers = themeDef.tiers || [];

      setActionLoading((prev) => ({ ...prev, [field.id]: true }));
      setActionStatus((prev) => {
        const next = { ...prev };
        delete next[field.id];
        return next;
      });

      try {
        const result = await voiceAnnouncer.generateVoiceClipsForTheme(
          themeId,
          tiers,
          prefix,
          language === 'en' ? 'en' : 'fr'
        );

        if (result.success) {
          setActionStatus((prev) => ({
            ...prev,
            [field.id]: {
              success: true,
              message: `${result.count} clips vocaux générés et chargés en mémoire RAM (0.00ms) !`
            }
          }));
        } else {
          setActionStatus((prev) => ({
            ...prev,
            [field.id]: {
              success: false,
              message: result.error || 'Échec de la génération'
            }
          }));
        }
      } catch (e: any) {
        setActionStatus((prev) => ({
          ...prev,
          [field.id]: {
            success: false,
            message: e.message || 'Erreur réseau'
          }
        }));
      } finally {
        setActionLoading((prev) => ({ ...prev, [field.id]: false }));
      }
    }
  };

  const allFields = Object.values(schema);

  // Filtrer les champs par catégories autorisées (si spécifiées)
  const availableFields = allFields.filter((f) => {
    if (allowedCategories && allowedCategories.length > 0) {
      return !!f.category && (allowedCategories as readonly string[]).includes(f.category);
    }
    return true;
  });

  const filteredFields = availableFields.filter((f) => {
    if (f.visibleIf && !f.visibleIf(values)) return false;
    if (activeTab === 'all') return true;
    return f.category === activeTab;
  });

  // Catégories effectivement présentes dans ce panneau
  const presentCategories = Array.from(
    new Set(availableFields.map((f) => f.category))
  ) as ('gameplay' | 'physics' | 'visuals' | 'texts' | 'audio')[];

  const showCategoryTabs = presentCategories.length > 1;

  // Grouper les champs par catégorie si en mode 'all' et multiples catégories
  const shouldGroupByCategory = activeTab === 'all' && presentCategories.length > 1;

  const renderField = (field: any) => {
    const val = values[field.id] !== undefined ? values[field.id] : field.defaultValue;
    const meta = getFieldMeta(field.id);
    const fieldLabel = meta.label || field.label;
    const fieldDesc = meta.description || field.description;

    if (field.type === 'range') {
      const range = field as RangeConfigField;
      return (
        <div key={field.id} className="space-y-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 hover:border-slate-700/80 transition-colors">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-200">{fieldLabel}</span>
            <span className="font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-500/30 text-[11px] font-bold">
              {val}
              {range.unit ? ` ${range.unit}` : ''}
            </span>
          </div>
          <input
            type="range"
            min={range.min}
            max={range.max}
            step={range.step}
            value={val}
            onChange={(e) => onChange(field.id, parseFloat(e.target.value))}
            className="w-full cursor-pointer accent-cyan-400 bg-slate-800 h-1.5 rounded-lg"
          />
          {fieldDesc && (
            <p className="text-[11px] text-slate-400 leading-snug">{fieldDesc}</p>
          )}
        </div>
      );
    }

    if (field.type === 'boolean') {
      return (
        <div
          key={field.id}
          className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 hover:border-slate-700/80 transition-colors gap-3"
        >
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-200">{fieldLabel}</div>
            {fieldDesc && (
              <p className="text-[11px] text-slate-400 leading-snug">{fieldDesc}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onChange(field.id, !val)}
            className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${val ? 'bg-cyan-500 shadow-neon-cyan' : 'bg-slate-700'
              }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${val ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
          </button>
        </div>
      );
    }

    if (field.type === 'select') {
      const selectField = field as any;
      const optionCount = selectField.options.length;
      const gridColsClass =
        optionCount <= 2
          ? 'grid-cols-2'
          : optionCount % 3 === 0
            ? 'grid-cols-3'
            : optionCount >= 5
              ? 'grid-cols-2 sm:grid-cols-3'
              : 'grid-cols-2';

      return (
        <div
          key={field.id}
          className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 hover:border-slate-700/80 transition-colors"
        >
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-200">{fieldLabel}</span>
          </div>
          <div className={`grid ${gridColsClass} gap-1.5`}>
            {selectField.options.map((opt: any) => {
              const isSelected = val === opt.value;
              const isHexColor = typeof opt.value === 'string' && opt.value.startsWith('#');
              const isRainbow = opt.value === 'rainbow';

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange(field.id, opt.value)}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all text-center flex items-center justify-center gap-1.5 ${isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-neon-cyan'
                      : 'bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border-slate-700/60'
                    }`}
                >
                  {isHexColor && (
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white/40 shadow-sm flex-shrink-0"
                      style={{ backgroundColor: opt.value }}
                    />
                  )}
                  {isRainbow && (
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white/40 shadow-sm flex-shrink-0 bg-gradient-to-tr from-rose-500 via-amber-400 to-cyan-400 animate-pulse"
                    />
                  )}
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
          {fieldDesc && (
            <p className="text-[11px] text-slate-400 leading-snug">{fieldDesc}</p>
          )}
        </div>
      );
    }

    if (field.type === 'tier-list') {
      const activeIndices: number[] = Array.isArray(val) ? val : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const minCount = field.minCount || 5;
      const maxCount = field.maxCount || 10;
      const currentTheme = values.SKIN_THEME || 'solar';
      const themeDef = getThemeDefinition(currentTheme);
      const tiers = themeDef ? themeDef.tiers : [];

      const toggleTier = (index: number) => {
        if (activeIndices.includes(index)) {
          if (activeIndices.length <= minCount) {
            return; // Bloquer à 5 minimum
          }
          const next = activeIndices.filter((i) => i !== index).sort((a, b) => a - b);
          onChange(field.id, next);
        } else {
          if (activeIndices.length >= maxCount) return;
          const next = [...activeIndices, index].sort((a, b) => a - b);
          onChange(field.id, next);
        }
      };

      return (
        <div
          key={field.id}
          className="space-y-2.5 bg-slate-900/70 p-3 rounded-xl border border-slate-800/80 hover:border-slate-700/80 transition-colors"
        >
          {/* En-tête avec compteur */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200">{fieldLabel}</span>
            <span
              className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                activeIndices.length === minCount
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                  : 'bg-cyan-950/80 text-cyan-400 border-cyan-500/30'
              }`}
            >
              {activeIndices.length}/{tiers.length} {language === 'en' ? 'active' : 'actives'} (min {minCount})
            </span>
          </div>

          {/* Raccourcis rapides */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => onChange(field.id, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].slice(0, tiers.length))}
              className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                activeIndices.length === tiers.length
                  ? 'bg-cyan-500/25 text-cyan-300 border-cyan-500 shadow-neon-cyan'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200'
              }`}
            >
              {language === 'en' ? `All (${tiers.length})` : `Toutes (${tiers.length})`}
            </button>
            <button
              type="button"
              onClick={() => onChange(field.id, [0, 1, 3, 5, 7, 8, 9].filter((i) => i < tiers.length))}
              className="px-2 py-1 text-[11px] font-semibold rounded-lg border bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200 transition-all"
            >
              7 {language === 'en' ? 'balls' : 'billes'}
            </button>
            <button
              type="button"
              onClick={() => onChange(field.id, [0, 2, 4, 6, 9].filter((i) => i < tiers.length))}
              className="px-2 py-1 text-[11px] font-semibold rounded-lg border bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200 transition-all"
            >
              5 {language === 'en' ? 'balls (fast)' : 'billes (rapide)'}
            </button>
          </div>

          {/* Grille des 10 billes disponibles */}
          <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-0.5 scrollbar-thin">
            {tiers.map((tier, idx) => {
              const isChecked = activeIndices.includes(idx);
              const isAtMin = isChecked && activeIndices.length <= minCount;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleTier(idx)}
                  className={`flex items-center justify-between p-2 rounded-lg border text-left transition-all ${
                    isChecked
                      ? 'bg-slate-800/90 border-cyan-500/50 text-slate-100 shadow-sm'
                      : 'bg-slate-900/40 border-slate-800/60 text-slate-500 opacity-60 hover:opacity-85'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    {/* Pastille visuelle de la bille */}
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 border border-white/20 shadow-sm"
                      style={{ backgroundColor: tier.color }}
                    >
                      {tier.image ? (
                        <img
                          src={tier.image}
                          alt={tier.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span>{tier.symbol}</span>
                      )}
                    </div>
                    <div className="truncate">
                      <div className="text-[11px] font-bold truncate leading-tight">
                        {language === 'en' ? tier.nameEn : tier.name}
                      </div>
                      <div className="text-[9px] font-mono text-slate-400">
                        P{idx + 1}
                      </div>
                    </div>
                  </div>

                  {/* Case à cocher personnalisée */}
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-all ${
                      isChecked
                        ? isAtMin
                          ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300'
                          : 'bg-cyan-500 border-cyan-400 text-black font-black'
                        : 'border-slate-600 bg-slate-800/80'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {activeIndices.length <= minCount && (
            <p className="text-[10px] text-amber-400/90 font-medium">
              ⚠️ {language === 'en' ? 'Minimum 5 balls required for proper gameplay.' : 'Minimum 5 billes requises pour le jeu.'}
            </p>
          )}

          {fieldDesc && (
            <p className="text-[11px] text-slate-400 leading-snug">{fieldDesc}</p>
          )}
        </div>
      );
    }

    if (field.type === 'text') {
      const textField = field as StringConfigField;
      return (
        <div
          key={field.id}
          className="space-y-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 hover:border-slate-700/80 transition-colors"
        >
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-200">{fieldLabel}</span>
          </div>
          <input
            type="text"
            value={val ?? ''}
            placeholder={textField.placeholder || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-sans"
          />
          {fieldDesc && (
            <p className="text-[11px] text-slate-400 leading-snug">{fieldDesc}</p>
          )}
        </div>
      );
    }

    if (field.type === 'action-button') {
      const actionField = field as ActionButtonConfigField;
      const isLoading = !!actionLoading[field.id];
      const status = actionStatus[field.id];

      return (
        <div
          key={field.id}
          className="space-y-2.5 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-cyan-950/40 p-3.5 rounded-xl border border-cyan-500/30 hover:border-cyan-400/50 transition-all shadow-md"
        >
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              {fieldLabel}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-bold">
              0.00ms RAM
            </span>
          </div>

          {fieldDesc && (
            <p className="text-[11px] text-slate-300 leading-snug">{fieldDesc}</p>
          )}

          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleActionButtonClick(actionField)}
            className={`w-full py-2.5 px-3.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              isLoading
                ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/40 cursor-wait opacity-80'
                : 'bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-neon-cyan hover:shadow-cyan-500/50 active:scale-[0.98]'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                <span>Génération des 10 voix en cours...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 text-cyan-200" />
                <span>{actionField.buttonText || fieldLabel}</span>
              </>
            )}
          </button>

          {status && (
            <div
              className={`text-[11px] px-2.5 py-1.5 rounded-md border flex items-center gap-1.5 animate-fadeIn ${
                status.success
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
              }`}
            >
              {status.success ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              )}
              <span className="font-medium">{status.message}</span>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      {/* Barre d'onglets (catégories) */}
      {showCategoryTabs && (
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${activeTab === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-neon-cyan'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
            >
              {t('tabs.all')}
            </button>

            {presentCategories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat] || Sliders;
              const isActive = activeTab === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveTab(cat)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-neon-cyan'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{t(`tabs.${cat}` as any)}</span>
                </button>
              );
            })}
          </div>

          {showReset && onReset && (
            <button
              type="button"
              onClick={onReset}
              title={t('settings.reset_all')}
              className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 rounded-lg transition-colors flex-shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Affichage des champs avec sous-titres de catégorie en mode 'all' */}
      {shouldGroupByCategory ? (
        <div className="space-y-5">
          {presentCategories.map((cat) => {
            const catFields = filteredFields.filter((f) => f.category === cat);
            if (catFields.length === 0) return null;
            const Icon = CATEGORY_ICONS[cat] || Sliders;
            const catTitle =
              language === 'fr'
                ? CATEGORY_NAMES_FR[cat] || cat
                : CATEGORY_NAMES_EN[cat] || cat;

            return (
              <div key={cat} className="space-y-2.5">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-800/60">
                  <div className="w-5 h-5 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Icon className="w-3 h-3" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    {catTitle}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 ml-auto">
                    ({catFields.length})
                  </span>
                </div>

                <div className="space-y-3">
                  {catFields.map(renderField)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFields.map(renderField)}
        </div>
      )}
    </div>
  );
};
