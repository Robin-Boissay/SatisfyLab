import React from 'react';

interface GameCardArtworkProps {
  gameId: string;
}

export const GameCardArtwork: React.FC<GameCardArtworkProps> = ({ gameId }) => {
  if (gameId === 'ball-escape') {
    return (
      <div className="relative w-full h-44 overflow-hidden rounded-2xl bg-gradient-to-b from-[#0a1120] to-[#05070c] border border-cyan-500/20 flex items-center justify-center">
        <svg viewBox="0 0 300 180" className="w-full h-full">
          <defs>
            <radialGradient id="escapeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
            </radialGradient>
            <filter id="neonBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Halo central */}
          <circle cx="150" cy="90" r="70" fill="url(#escapeGlow)" />

          {/* Arène circulaire découpée (briques) */}
          <circle cx="150" cy="90" r="58" fill="none" stroke="#1e293b" strokeWidth="6" />
          <circle
            cx="150"
            cy="90"
            r="58"
            fill="none"
            stroke="#00f0ff"
            strokeWidth="5"
            strokeDasharray="22 8"
            strokeDashoffset="14"
            filter="url(#neonBlur)"
          />

          {/* Brèche ouverte */}
          <path
            d="M 195 50 A 58 58 0 0 1 208 90"
            fill="none"
            stroke="transparent"
            strokeWidth="8"
          />

          {/* Trajectoire et Traînée */}
          <path
            d="M 120 120 Q 140 70 175 75 T 215 45"
            fill="none"
            stroke="rgba(0, 240, 255, 0.3)"
            strokeWidth="2"
            strokeDasharray="4 4"
          />

          {/* Bille en fuite */}
          <circle cx="215" cy="45" r="9" fill="#ffffff" filter="url(#neonBlur)" />
          <circle cx="215" cy="45" r="7" fill="#00f0ff" />
          <circle cx="213" cy="43" r="2.5" fill="#ffffff" />

          {/* Particules d'éclats */}
          <circle cx="225" cy="40" r="2" fill="#00f0ff" />
          <circle cx="222" cy="55" r="2.5" fill="#00f0ff" />
          <circle cx="205" cy="35" r="1.5" fill="#ffffff" />

          {/* Compteur néon HUD */}
          <rect x="115" y="16" width="70" height="22" rx="6" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(0, 240, 255, 0.4)" strokeWidth="1" />
          <text x="150" y="31" fill="#00f0ff" fontSize="10" fontWeight="900" fontFamily="monospace" textAnchor="middle">
            00:18s
          </text>
        </svg>

        <div className="absolute inset-0 bg-gradient-to-t from-[#06080d] via-transparent to-transparent pointer-events-none" />
      </div>
    );
  }

  if (gameId === 'merge-drop') {
    return (
      <div className="relative w-full h-44 overflow-hidden rounded-2xl bg-gradient-to-b from-[#1a1306] via-[#0d0914] to-[#05070c] border border-amber-500/20 flex items-center justify-center">
        <svg viewBox="0 0 300 180" className="w-full h-full">
          <defs>
            <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffb300" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ff5500" stopOpacity="0" />
            </radialGradient>
            <filter id="goldGlow">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Silhouette Jarre */}
          <path
            d="M 125 35 L 138 60 L 138 80 Q 90 120 105 160 L 195 160 Q 210 120 162 80 L 162 60 L 175 35"
            fill="rgba(20, 26, 42, 0.45)"
            stroke="#00f0ff"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Soleil Cosmique (Élément Ultime au centre bas) */}
          <circle cx="150" cy="128" r="32" fill="url(#sunGlow)" />
          <circle cx="150" cy="128" r="24" fill="#ff6d00" filter="url(#goldGlow)" />
          <circle cx="150" cy="128" r="20" fill="#ffb300" />
          <circle cx="145" cy="123" r="5" fill="#fff59d" />
          <text x="150" y="133" fill="#ffffff" fontSize="13" textAnchor="middle">☀️</text>

          {/* Planètes secondaires */}
          {/* Terre */}
          <circle cx="118" cy="115" r="14" fill="#1e88e5" />
          <text x="118" y="119" fill="#ffffff" fontSize="9" textAnchor="middle">🌍</text>

          {/* Saturne avec anneaux */}
          <ellipse cx="180" cy="108" rx="20" ry="7" fill="none" stroke="#ffe082" strokeWidth="2.5" transform="rotate(-15 180 108)" />
          <circle cx="180" cy="108" r="13" fill="#fdd835" />
          <text x="180" y="112" fill="#ffffff" fontSize="9" textAnchor="middle">🪐</text>

          {/* Orbe en chute depuis l'entonnoir */}
          <circle cx="150" cy="46" r="10" fill="#e53935" filter="url(#goldGlow)" />
          <text x="150" y="50" fill="#ffffff" fontSize="8" textAnchor="middle">🔴</text>

          {/* Rayon indicateur de visée */}
          <line x1="150" y1="56" x2="150" y2="85" stroke="rgba(0, 240, 255, 0.5)" strokeWidth="2" strokeDasharray="3 3" />
        </svg>

        <div className="absolute inset-0 bg-gradient-to-t from-[#06080d] via-transparent to-transparent pointer-events-none" />
      </div>
    );
  }

  if (gameId === 'ball-duel') {
    return (
      <div className="relative w-full h-44 overflow-hidden rounded-2xl bg-gradient-to-b from-[#14061a] via-[#090b14] to-[#05070c] border border-pink-500/20 flex items-center justify-center">
        <svg viewBox="0 0 300 180" className="w-full h-full">
          <defs>
            <filter id="duelNeon">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Colonne Gauche */}
          <rect x="30" y="25" width="112" height="135" fill="rgba(0, 240, 255, 0.04)" stroke="#00f0ff" strokeWidth="2" rx="8" />

          {/* Colonne Droite */}
          <rect x="158" y="25" width="112" height="135" fill="rgba(255, 0, 127, 0.04)" stroke="#ff007f" strokeWidth="2" rx="8" />

          {/* Séparateur central */}
          <line x1="150" y1="20" x2="150" y2="165" stroke="#475569" strokeWidth="3" />

          {/* Barres horizontales Gauche */}
          <rect x="38" y="55" width="96" height="12" rx="3" fill="#0088cc" stroke="#00f0ff" strokeWidth="1.5" />
          <text x="86" y="64" fill="#ffffff" fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle">40 HP</text>

          <rect x="38" y="95" width="96" height="12" rx="3" fill="#0f172a" stroke="#00f0ff" strokeWidth="1.5" strokeDasharray="4 2" />
          <text x="86" y="104" fill="#94a3b8" fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle">DÉTRUIT !</text>

          {/* Barres horizontales Droite */}
          <rect x="166" y="55" width="96" height="12" rx="3" fill="#c026d3" stroke="#ff007f" strokeWidth="1.5" />
          <text x="214" y="64" fill="#ffffff" fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle">85 HP</text>

          <rect x="166" y="95" width="96" height="12" rx="3" fill="#ff007f" stroke="#ff007f" strokeWidth="1.5" />
          <text x="214" y="104" fill="#ffffff" fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle">120 HP</text>

          {/* Balles Bleues Gauche */}
          <circle cx="65" cy="40" r="6" fill="#00f0ff" filter="url(#duelNeon)" />
          <circle cx="105" cy="45" r="6" fill="#00f0ff" filter="url(#duelNeon)" />
          <circle cx="86" cy="118" r="6" fill="#00f0ff" filter="url(#duelNeon)" />
          <circle cx="70" cy="135" r="6" fill="#00f0ff" filter="url(#duelNeon)" />

          {/* Balles Roses Droite */}
          <circle cx="185" cy="40" r="7" fill="#ff007f" filter="url(#duelNeon)" />
          <circle cx="235" cy="45" r="7" fill="#ff007f" filter="url(#duelNeon)" />

          {/* Badge VS central */}
          <circle cx="150" cy="75" r="14" fill="#0f172a" stroke="#ffd700" strokeWidth="2" />
          <text x="150" y="79" fill="#ffd700" fontSize="9" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
            VS
          </text>

          {/* Badge Boost */}
          <rect x="52" y="145" width="68" height="14" rx="4" fill="rgba(0, 240, 255, 0.2)" stroke="#00f0ff" strokeWidth="1" />
          <text x="86" y="155" fill="#00f0ff" fontSize="7" fontWeight="bold" textAnchor="middle">x2 BALLES !</text>
        </svg>

        <div className="absolute inset-0 bg-gradient-to-t from-[#06080d] via-transparent to-transparent pointer-events-none" />
      </div>
    );
  }

  // Territory War (Guerre de Territoire)
  return (
    <div className="relative w-full h-44 overflow-hidden rounded-2xl bg-gradient-to-b from-[#0b1424] via-[#0d091a] to-[#05070c] border border-cyan-500/25 flex items-center justify-center">
      <svg viewBox="0 0 300 180" className="w-full h-full">
        <defs>
          <filter id="warNeon">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Cadre de l'Arène */}
        <rect x="35" y="20" width="230" height="135" rx="6" fill="#090d16" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5" />

        {/* Grille de tuiles (Cyan à gauche, Rose à droite avec frontière organique) */}
        {/* Tuiles Cyan */}
        {[0, 1, 2, 3, 4, 5].map((col) =>
          [0, 1, 2, 3, 4, 5, 6].map((row) => (
            <rect
              key={`c-${col}-${row}`}
              x={40 + col * 18}
              y={25 + row * 18}
              width={16}
              height={16}
              rx={2}
              fill="rgba(0, 180, 240, 0.75)"
              stroke="rgba(0, 240, 255, 0.3)"
              strokeWidth="0.8"
            />
          ))
        )}

        {/* Tuiles Magenta */}
        {[6, 7, 8, 9, 10, 11].map((col) =>
          [0, 1, 2, 3, 4, 5, 6].map((row) => (
            <rect
              key={`m-${col}-${row}`}
              x={40 + col * 18}
              y={25 + row * 18}
              width={16}
              height={16}
              rx={2}
              fill="rgba(230, 0, 115, 0.75)"
              stroke="rgba(255, 0, 127, 0.3)"
              strokeWidth="0.8"
            />
          ))
        )}

        {/* Tuiles envahies / conquises en frontière */}
        <rect x={148} y={43} width={16} height={16} rx={2} fill="#ffffff" filter="url(#warNeon)" />
        <rect x={148} y={61} width={16} height={16} rx={2} fill="rgba(0, 180, 240, 0.9)" />
        <rect x={130} y={79} width={16} height={16} rx={2} fill="rgba(230, 0, 115, 0.9)" />
        <rect x={130} y={97} width={16} height={16} rx={2} fill="#ffffff" filter="url(#warNeon)" />

        {/* Bille Cyan conquérante */}
        <circle cx="160" cy="52" r="8" fill="#ffffff" filter="url(#warNeon)" />
        <circle cx="160" cy="52" r="6" fill="#00f0ff" />
        <path d="M 175 42 L 160 52" stroke="rgba(0, 240, 255, 0.5)" strokeWidth="2" strokeDasharray="2 2" />

        {/* Bille Magenta conquérante */}
        <circle cx="120" cy="106" r="8" fill="#ffffff" filter="url(#warNeon)" />
        <circle cx="120" cy="106" r="6" fill="#ff007f" />
        <path d="M 105 116 L 120 106" stroke="rgba(255, 0, 127, 0.5)" strokeWidth="2" strokeDasharray="2 2" />

        {/* Jauge de score / pourcentage en bas */}
        <rect x="35" y="158" width="115" height="6" rx="2" fill="#00f0ff" />
        <rect x="150" y="158" width="115" height="6" rx="2" fill="#ff007f" />
        <text x="35" y="172" fill="#00f0ff" fontSize="8" fontWeight="bold" fontFamily="monospace">52.4% CYAN</text>
        <text x="265" y="172" fill="#ff007f" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="end">ROSE 47.6%</text>
      </svg>

      <div className="absolute inset-0 bg-gradient-to-t from-[#06080d] via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

