import React, { useState, useEffect } from 'react';
import { useLanguage } from '../core/i18n';
import {
  X,
  Copy,
  Check,
  Download,
  Upload,
  Bookmark,
  Trash2,
  FileText,
  AlertCircle,
  Save,
  RotateCcw
} from 'lucide-react';

interface SavedPreset {
  id: string;
  name: string;
  date: string;
  config: Record<string, any>;
}

interface PresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  gameName: string;
  currentConfig: Record<string, any>;
  onApplyPreset: (config: Record<string, any>) => void;
}

export const PresetModal: React.FC<PresetModalProps> = ({
  isOpen,
  onClose,
  gameId,
  gameName,
  currentConfig,
  onApplyPreset
}) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'saved'>('export');
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  const storageKey = `satisfylab_presets_${gameId}`;

  // Charger les presets sauvegardés depuis localStorage
  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSavedPresets(parsed);
        }
      } else {
        setSavedPresets([]);
      }
    } catch {
      setSavedPresets([]);
    }
    setImportText('');
    setImportError(null);
    setCopied(false);
    setSaveSuccess(false);
    setApplySuccess(false);
    setPresetNameInput(
      `Preset ${gameName} - ${new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`
    );
  }, [isOpen, gameId, gameName, storageKey, language]);

  if (!isOpen) return null;

  const jsonConfig = JSON.stringify(
    {
      _format: 'satisfylab-preset-v1',
      gameId,
      gameName,
      exportedAt: new Date().toISOString(),
      config: currentConfig
    },
    null,
    2
  );

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonConfig);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadJson = () => {
    try {
      const blob = new Blob([jsonConfig], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const cleanName = gameId.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `${cleanName}-preset-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleSaveToLocalStorage = () => {
    const trimmed = presetNameInput.trim();
    if (!trimmed) return;
    const newPreset: SavedPreset = {
      id: 'preset-' + Date.now(),
      name: trimmed,
      date: new Date().toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US'),
      config: { ...currentConfig }
    };
    const updated = [newPreset, ...savedPresets];
    setSavedPresets(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleDeleteSavedPreset = (id: string) => {
    const updated = savedPresets.filter((p) => p.id !== id);
    setSavedPresets(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleApplyConfigObject = (rawConfig: any) => {
    try {
      let targetConfig = rawConfig;
      // Si format encapsulé avec { config: { ... } }
      if (rawConfig && typeof rawConfig === 'object' && rawConfig.config) {
        if (rawConfig.gameId && rawConfig.gameId !== gameId) {
          const proceed = window.confirm(
            language === 'fr'
              ? `Attention : Ce preset a été exporté pour "${rawConfig.gameName || rawConfig.gameId}". Voulez-vous quand même appliquer les paramètres compatibles à ${gameName} ?`
              : `Warning: This preset was exported for "${rawConfig.gameName || rawConfig.gameId}". Do you still want to apply matching settings to ${gameName}?`
          );
          if (!proceed) return;
        }
        targetConfig = rawConfig.config;
      }

      if (!targetConfig || typeof targetConfig !== 'object') {
        throw new Error(
          language === 'fr'
            ? 'Format de preset invalide (objet JSON attendu).'
            : 'Invalid preset format (expected JSON object).'
        );
      }

      onApplyPreset(targetConfig);
      setApplySuccess(true);
      setTimeout(() => {
        setApplySuccess(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setImportError(err.message || String(err));
    }
  };

  const handleApplyImportText = () => {
    setImportError(null);
    if (!importText.trim()) {
      setImportError(
        language === 'fr'
          ? 'Veuillez coller le texte JSON du preset.'
          : 'Please paste the preset JSON text.'
      );
      return;
    }
    try {
      const parsed = JSON.parse(importText);
      handleApplyConfigObject(parsed);
    } catch (err: any) {
      setImportError(
        language === 'fr'
          ? `JSON invalide : ${err.message}`
          : `Invalid JSON: ${err.message}`
      );
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setImportText(text);
        const parsed = JSON.parse(text);
        handleApplyConfigObject(parsed);
      } catch (err: any) {
        setImportError(
          language === 'fr'
            ? `Erreur de lecture du fichier : ${err.message}`
            : `File read error: ${err.message}`
        );
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preset-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/60 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h2 id="preset-modal-title" className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>{t('presets.modal_title')}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 font-mono border border-slate-700">
                  {gameName}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'fr'
                  ? 'Sauvegardez, partagez et chargez vos configurations personnalisées.'
                  : 'Save, share, and restore your custom game settings.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/40 px-4 pt-2 gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('export');
              setImportError(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'export'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>{t('presets.export_tab')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('import');
              setImportError(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'import'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>{t('presets.import_tab')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('saved');
              setImportError(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'saved'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>{t('presets.my_presets')}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
              {savedPresets.length}
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
          {applySuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{t('presets.apply_success')}</span>
            </div>
          )}

          {/* TAB 1: EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              {/* Sauvegarde rapide en local */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-750 space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  {t('presets.save_local_title')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={presetNameInput}
                    onChange={(e) => setPresetNameInput(e.target.value)}
                    placeholder="Nom du preset..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleSaveToLocalStorage}
                    disabled={!presetNameInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors flex-shrink-0"
                  >
                    {saveSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{t('presets.saved_success')}</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>{t('presets.save_local_btn')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Prévisualisation & Copie/Téléchargement JSON */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{language === 'fr' ? 'Données JSON du preset' : 'Preset JSON data'}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyJson}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-cyan-400 flex items-center gap-1.5 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">{t('presets.copied')}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{t('presets.copy_json')}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadJson}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-cyan-400 flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{t('presets.download_json')}</span>
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <pre className="w-full h-56 p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-cyan-300/90 overflow-auto select-all custom-scrollbar leading-relaxed">
                    {jsonConfig}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IMPORT */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-slate-800/40 border border-slate-750">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-slate-200">
                    {t('presets.load_file_btn')}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {language === 'fr'
                      ? 'Chargez un fichier .json depuis votre ordinateur'
                      : 'Load a .json file from your computer'}
                  </div>
                </div>

                <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-2 transition-colors flex-shrink-0">
                  <Upload className="w-4 h-4" />
                  <span>{language === 'fr' ? 'Parcourir (.json)' : 'Browse (.json)'}</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  {t('presets.paste_json_placeholder')}
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => {
                    setImportText(e.target.value);
                    setImportError(null);
                  }}
                  rows={8}
                  placeholder="{\n  &quot;GAME_SPEED&quot;: 1.2,\n  ...\n}"
                  className="w-full p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400 custom-scrollbar resize-none leading-relaxed"
                />
              </div>

              {importError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleApplyImportText}
                  disabled={!importText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors shadow-lg shadow-cyan-500/10"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{t('presets.apply_btn')}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SAVED PRESETS */}
          {activeTab === 'saved' && (
            <div className="space-y-3">
              {savedPresets.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <Bookmark className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">{t('presets.no_presets')}</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('export')}
                    className="text-xs font-semibold text-cyan-400 hover:underline inline-block pt-1"
                  >
                    {language === 'fr'
                      ? 'Créer et sauvegarder votre premier preset'
                      : 'Create and save your first preset'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-750 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-200 truncate">
                          {preset.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {preset.date}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleApplyConfigObject(preset.config)}
                          className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{t('presets.load_btn')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteSavedPreset(preset.id)}
                          title={t('presets.delete_btn')}
                          className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
