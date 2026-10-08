import React from 'react';

interface SoMuchLogoProps {
  className?: string;
  variant?: 'badge' | 'plain' | 'print';
  height?: number | string;
}

export const SoMuchLogo: React.FC<SoMuchLogoProps> = ({
  className = 'h-10',
  variant = 'badge',
}) => {
  // SVG representation matching the SO MUCH brand logo
  const svgContent = (
    <svg
      viewBox="0 0 480 140"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full object-contain"
    >
      <defs>
        <linearGradient id="soMuchGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="35%" stopColor="#f59e0b" />
          <stop offset="70%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <filter id="goldGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#92400e" floodOpacity="0.3" />
        </filter>
      </defs>

      <g fill="url(#soMuchGold)" filter="url(#goldGlow)">
        {/* Letter 'S' */}
        <path d="M 58 35 C 78 35, 92 45, 92 60 C 92 73, 80 80, 68 83 L 52 86 C 42 89, 36 93, 36 100 C 36 108, 45 113, 58 113 C 72 113, 83 107, 90 99 L 90 114 C 82 122, 70 126, 56 126 C 36 126, 21 116, 21 100 C 21 86, 33 79, 46 76 L 62 72 C 71 70, 77 66, 77 59 C 77 52, 69 47, 58 47 C 46 47, 36 53, 30 60 L 30 45 C 39 39, 49 35, 58 35 Z" />

        {/* Letter 'O' */}
        <path d="M 138 35 C 166 35, 185 54, 185 81 C 185 107, 166 126, 138 126 C 111 126, 92 107, 92 81 C 92 54, 111 35, 138 35 Z M 138 48 C 120 48, 107 62, 107 81 C 107 99, 120 113, 138 113 C 157 113, 170 99, 170 81 C 170 62, 157 48, 138 48 Z" />

        {/* Diagonal Cut Slash in M */}
        <path d="M 206 35 L 222 35 L 188 126 L 172 126 Z" />

        {/* Letter 'M' (Stylized with angled peaks) */}
        <path d="M 218 35 L 235 35 L 253 95 L 271 35 L 288 35 L 288 126 L 273 126 L 273 62 L 258 112 L 248 112 L 233 62 L 233 126 L 218 126 Z" />

        {/* Letter 'U' */}
        <path d="M 302 35 L 317 35 L 317 96 C 317 107, 324 113, 335 113 C 345 113, 352 107, 352 96 L 352 35 L 367 35 L 367 96 C 367 117, 354 126, 335 126 C 315 126, 302 117, 302 96 Z" />

        {/* Letter 'C' */}
        <path d="M 416 48 L 416 35 C 408 36, 401 35, 395 35 C 375 35, 360 52, 360 81 C 360 109, 375 126, 395 126 C 402 126, 409 125, 416 124 L 416 111 C 410 113, 403 113, 396 113 C 384 113, 375 101, 375 81 C 375 60, 384 48, 396 48 C 403 48, 410 49, 416 51 Z" />

        {/* Letter 'H' */}
        <path d="M 428 35 L 443 35 L 443 72 L 464 72 L 464 35 L 479 35 L 479 126 L 464 126 L 464 85 L 443 85 L 443 126 L 428 126 Z" />
      </g>
    </svg>
  );

  if (variant === 'print') {
    return (
      <div className={`inline-flex items-center justify-center p-1.5 rounded-lg bg-[#272722] border border-[#3e3e37] ${className}`}>
        {svgContent}
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#24241f] via-[#32322d] to-[#24241f] border border-[#44443c] shadow-md hover:scale-102 transition-transform ${className}`}>
        {svgContent}
      </div>
    );
  }

  return <div className={`inline-flex items-center ${className}`}>{svgContent}</div>;
};
