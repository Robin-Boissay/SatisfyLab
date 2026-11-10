import React, { useState } from 'react';
import { ConfigSchema, RangeConfigField, StringConfigField } from '../core/types';
import { useLanguage } from '../core/i18n';
import { RotateCcw, Sliders, Activity, Eye, Type } from 'lucide-react';

export interface DynamicControlsProps {
  schema: ConfigSchema;
  values: Record<string, any>;
  defaultValues: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onReset?: () => void;
  allowedCategories?: ('gameplay' | 'physics' | 'visuals' | 'texts')[];
  defaultTab?: 'all' | 'gameplay' | 'physics' | 'visuals' | 'texts';
  showReset?: boolean;
}

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  gameplay: Sliders,
  physics: Activity,
  visuals: Eye,
  texts: Type
};

const CATEGORY_NAMES_FR: Record<string, string> = {
  gameplay: 'Gameplay & Règles',
  physics: 'Moteur Physique',
  visuals: 'Visuels & Conteneur',
  texts: 'Textes & Titres'
};

const CATEGORY_NAMES_EN: Record<string, string> = {
  gameplay: 'Gameplay & Rules',
  physics: 'Physics Engine',
  visuals: 'Visuals & Container',
  texts: 'Texts & Titles'
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
  const [activeTab, setActiveTab] = useState<'all' | 'gameplay' | 'physics' | 'visuals' | 'texts'>(defaultTab);

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
  ) as ('gameplay' | 'physics' | 'visuals' | 'texts')[];

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
