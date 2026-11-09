import React, { useState } from 'react';
import { ConfigSchema, RangeConfigField, BooleanConfigField, StringConfigField } from '../core/types';
import { useLanguage } from '../core/i18n';
import { RotateCcw, Sliders, Activity, Eye, Type } from 'lucide-react';

interface DynamicControlsProps {
  schema: ConfigSchema;
  values: Record<string, any>;
  defaultValues: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onReset: () => void;
}

export const DynamicControls: React.FC<DynamicControlsProps> = ({
  schema,
  values,
  defaultValues,
  onChange,
  onReset
}) => {
  const { t, getFieldMeta } = useLanguage();
  const [activeTab, setActiveTab] = useState<'all' | 'gameplay' | 'physics' | 'visuals' | 'texts'>('all');

  const fields = Object.values(schema);

  const filteredFields = fields.filter((f) => {
    if (activeTab === 'all') return true;
    return f.category === activeTab;
  });

  return (
    <div className="space-y-4">
      {/* Catégories de réglages */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-800">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${activeTab === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            {t('tabs.all')}
          </button>
          <button
            onClick={() => setActiveTab('gameplay')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${activeTab === 'gameplay'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <Sliders className="w-3 h-3" />
            {t('tabs.gameplay')}
          </button>
          <button
            onClick={() => setActiveTab('physics')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${activeTab === 'physics'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <Activity className="w-3 h-3" />
            {t('tabs.physics')}
          </button>
          <button
            onClick={() => setActiveTab('visuals')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${activeTab === 'visuals'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <Eye className="w-3 h-3" />
            {t('tabs.visuals')}
          </button>
          <button
            onClick={() => setActiveTab('texts')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${activeTab === 'texts'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <Type className="w-3 h-3" />
            {t('tabs.texts')}
          </button>
        </div>

        <button
          onClick={onReset}
          title={t('settings.reset_all')}
          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Liste des contrôles */}
      <div className="space-y-3.5">
        {filteredFields.map((field) => {
          const val = values[field.id] !== undefined ? values[field.id] : field.defaultValue;
          const meta = getFieldMeta(field.id);
          const fieldLabel = meta.label || field.label;
          const fieldDesc = meta.description || field.description;

          if (field.type === 'range') {
            const range = field as RangeConfigField;
            return (
              <div key={field.id} className="space-y-1.5 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-300">{fieldLabel}</span>
                  <span className="font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/20 text-[11px]">
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
                  className="w-full cursor-pointer"
                />
                {fieldDesc && (
                  <p className="text-[10px] text-slate-500 leading-tight">{fieldDesc}</p>
                )}
              </div>
            );
          }

          if (field.type === 'boolean') {
            return (
              <div
                key={field.id}
                className="flex items-center justify-between bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60 gap-3"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-medium text-slate-300">{fieldLabel}</div>
                  {fieldDesc && (
                    <p className="text-[10px] text-slate-500 leading-tight">{fieldDesc}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onChange(field.id, !val)}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${val ? 'bg-cyan-500 shadow-neon-cyan' : 'bg-slate-700'
                    }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${val ? 'translate-x-4' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>
            );
          }

          if (field.type === 'select') {
            const selectField = field as any;
            return (
              <div
                key={field.id}
                className="space-y-2 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-300">{fieldLabel}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {selectField.options.map((opt: any) => {
                    const isSelected = val === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(field.id, opt.value)}
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all text-center ${isSelected
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-neon-cyan'
                            : 'bg-slate-800/60 hover:bg-slate-700/60 text-slate-400 border-slate-700/60'
                          }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                {fieldDesc && (
                  <p className="text-[10px] text-slate-500 leading-tight">{fieldDesc}</p>
                )}
              </div>
            );
          }

          if (field.type === 'text') {
            const textField = field as StringConfigField;
            return (
              <div
                key={field.id}
                className="space-y-1.5 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-300">{fieldLabel}</span>
                </div>
                <input
                  type="text"
                  value={val ?? ''}
                  placeholder={textField.placeholder || ''}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-sans"
                />
                {fieldDesc && (
                  <p className="text-[10px] text-slate-500 leading-tight">{fieldDesc}</p>
                )}
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
};
