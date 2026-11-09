import { GameHUDState } from './types';

/**
 * Dessine le HUD textuel directement sur le Canvas (60 FPS)
 * Permet d'inclure le titre, les métriques et les textes personnalisés
 * directement dans l'enregistrement vidéo 9:16 sans post-production.
 */
export function drawCanvasHUD(
  ctx: CanvasRenderingContext2D,
  hud: GameHUDState,
  virtualWidth: number = 540
) {
  if (!hud) return;

  ctx.save();

  // 1. Dégradé sombre d'arrière-plan en haut pour contraster avec les éléments du jeu
  const topGrad = ctx.createLinearGradient(0, 0, 0, 140);
  topGrad.addColorStop(0, 'rgba(6, 8, 13, 0.92)');
  topGrad.addColorStop(0.7, 'rgba(6, 8, 13, 0.65)');
  topGrad.addColorStop(1, 'rgba(6, 8, 13, 0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, virtualWidth, 140);

  const centerX = virtualWidth / 2;

  // 2. Titre du jeu (ex: "BALL ESCAPE 30s", "CYAN VS ROSE", texte personnalisé...)
  if (hud.title) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '900 13px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = '#cbd5e1'; // slate-300
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(hud.title.toUpperCase(), centerX, 24);
    ctx.restore();
  }

  // 3. Ligne des métriques (Score / Rebonds / Temps / Pourcentages)
  const hasPrimary = hud.primaryMetricValue !== undefined;
  const hasSecondary = hud.secondaryMetricValue !== undefined;

  if (hasPrimary && hasSecondary) {
    const spacing = 88;

    // Métrique Primaire (Gauche)
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b'; // slate-500
    ctx.fillText((hud.primaryMetricLabel || 'SCORE').toUpperCase(), centerX - spacing, 48);

    const primaryColor = hud.primaryMetricColor || (hud.isDanger ? '#ef4444' : '#00f0ff');
    ctx.font = '900 23px "JetBrains Mono", monospace';
    ctx.fillStyle = primaryColor;
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 8;
    ctx.fillText(String(hud.primaryMetricValue), centerX - spacing, 64);
    ctx.restore();

    // Métrique Secondaire (Droite)
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText((hud.secondaryMetricLabel || 'REBONDS').toUpperCase(), centerX + spacing, 48);

    const secondaryColor = hud.secondaryMetricColor || '#f1f5f9';
    ctx.font = '900 23px "JetBrains Mono", monospace';
    ctx.fillStyle = secondaryColor;
    ctx.shadowColor = secondaryColor;
    ctx.shadowBlur = secondaryColor === '#f1f5f9' ? 2 : 8;
    ctx.fillText(String(hud.secondaryMetricValue), centerX + spacing, 64);
    ctx.restore();

  } else if (hasPrimary) {
    // Métrique Unique (Centrée)
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText((hud.primaryMetricLabel || 'SCORE').toUpperCase(), centerX, 48);

    const primaryColor = hud.primaryMetricColor || (hud.isDanger ? '#ef4444' : '#00f0ff');
    ctx.font = '900 25px "JetBrains Mono", monospace';
    ctx.fillStyle = primaryColor;
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 8;
    ctx.fillText(String(hud.primaryMetricValue), centerX, 64);
    ctx.restore();
  }

  // 4. Badge de statut (ex: "🔥 OVERDRIVE CYAN ACTIVÉ !", "VICTOIRE !", etc.)
  if (hud.statusText) {
    ctx.save();
    ctx.font = 'bold 11px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const textMetrics = ctx.measureText(hud.statusText);
    const pillW = Math.max(textMetrics.width + 24, 110);
    const pillH = 22;
    const pillX = centerX - pillW / 2;
    const pillY = 96;

    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 11);
    ctx.fillStyle = 'rgba(6, 28, 48, 0.88)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    ctx.lineWidth = 1;
    ctx.shadowColor = 'rgba(0, 240, 255, 0.35)';
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#67e8f9';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(hud.statusText, centerX, pillY + pillH / 2);
    ctx.restore();
  }

  ctx.restore();
}

