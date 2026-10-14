import React from 'react';
import { RunStats } from '../types/game';

interface GameOverModalProps {
  stats: RunStats;
  rattlesCurrency: number;
  onPlayAgain: () => void;
  onOpenArmory: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  rattlesCurrency,
  onPlayAgain,
  onOpenArmory,
}) => {
  const isVictory = stats.victory;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col gap-6 text-center">
        {/* Banner */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-700 shadow-lg">
            <img
              src={
                isVictory
                  ? '/src/assets/images/player_gorilla_sprite_1792004033798.jpg'
                  : '/src/assets/images/single_coughing_baby_1792004400595.jpg'
              }
              alt="Run Outcome"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Expedition Concluded</span>
            <span aria-hidden="true">·</span>
            <span className={isVictory ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
              {isVictory ? 'VICTORY ACHIEVED' : 'COUGHED OUT'}
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-100 font-display">
            {isVictory ? 'The Nursery is Liberated!' : 'Kongrad Has Succumbed to the Aerosol'}
          </h2>
          <p className="text-xs text-slate-400 max-w-sm">
            {isVictory
              ? 'The Diaper Duke of Discontent has been toppled. The realm of fine dining silverware reigns supreme!'
              : 'The bio-cough storm proved overwhelming. Dust off your tines and forge a new run!'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-left">
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-500">Floor Reached</span>
            <span className="text-base font-bold text-slate-200 font-mono">
              Floor {stats.floor}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] text-slate-500">Babies Defeated</span>
            <span className="text-base font-bold text-sky-400 font-mono">
              {stats.babiesDefeated}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] text-slate-500">Max Kinetic Impact</span>
            <span className="text-base font-bold text-amber-400 font-mono">
              {stats.maxKineticImpact} Force
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] text-slate-500">Rattles Banked</span>
            <span className="text-base font-bold text-emerald-400 font-mono">
              ★ {rattlesCurrency}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onOpenArmory}
            className="w-full sm:flex-1 py-2.5 px-4 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Visit Armory
          </button>
          <button
            onClick={onPlayAgain}
            className="w-full sm:flex-1 py-2.5 px-4 text-xs font-bold text-slate-900 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors cursor-pointer shadow-md"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};
