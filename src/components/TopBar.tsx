import React from 'react';
import { GameState } from '../types/game';

interface TopBarProps {
  gameState: GameState;
  onNavigate: (target: GameState) => void;
  onStartNewRun: () => void;
  soundEnabled: boolean;
  musicEnabled: boolean;
  onToggleSound: () => void;
  onToggleMusic: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  gameState,
  onNavigate,
  onStartNewRun,
  soundEnabled,
  musicEnabled,
  onToggleSound,
  onToggleMusic,
}) => {
  return (
    <header className="w-full flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 shrink-0 z-30">
      {/* Zone 1: Single text element wordmark */}
      <button 
        onClick={() => onNavigate('TITLE_MENU')} 
        className="text-lg font-bold tracking-tight text-slate-100 hover:text-sky-400 transition-colors whitespace-nowrap shrink-0 text-left cursor-pointer"
      >
        Gorilla with a Fork
      </button>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
        <button
          onClick={() => onNavigate(gameState === 'TITLE_MENU' ? 'TITLE_MENU' : 'PLAYING')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            gameState === 'PLAYING' ? 'text-sky-400' : ''
          }`}
        >
          Arena
        </button>
        <button
          onClick={() => onNavigate('ARMORY')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            gameState === 'ARMORY' ? 'text-sky-400' : ''
          }`}
        >
          Utensils
        </button>
        <button
          onClick={() => onNavigate('MAP_SELECT')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            gameState === 'MAP_SELECT' ? 'text-sky-400' : ''
          }`}
        >
          Floor Map
        </button>
        <button
          onClick={() => onNavigate('HOW_TO_PLAY')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            gameState === 'HOW_TO_PLAY' ? 'text-sky-400' : ''
          }`}
        >
          How to Play
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute SFX' : 'Enable SFX'}
            className="px-2 py-1 hover:text-slate-200 transition-colors cursor-pointer"
          >
            SFX: {soundEnabled ? 'ON' : 'OFF'}
          </button>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <button
            onClick={onToggleMusic}
            title={musicEnabled ? 'Mute Music' : 'Enable Music'}
            className="px-2 py-1 hover:text-slate-200 transition-colors cursor-pointer"
          >
            BGM: {musicEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        <button
          onClick={onStartNewRun}
          className="px-4 py-2 text-xs font-semibold text-slate-900 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
        >
          {gameState === 'PLAYING' ? 'Restart Run' : 'New Run'}
        </button>
      </div>
    </header>
  );
};
